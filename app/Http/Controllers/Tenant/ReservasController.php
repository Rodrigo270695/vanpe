<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ReservationRequest;
use App\Models\Tenant\CfgSetting;
use App\Models\Tenant\Reservation;
use App\Models\Tenant\RstArea;
use App\Models\Tenant\RstTable;
use App\Models\Tenant\WaitingList;
use App\Services\Tenant\ReservationCodeGenerator;
use App\Services\Tenant\ReservationWorkflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Reservas del restaurante: manuales y (futuro) proyectadas desde la app. */
class ReservasController extends Controller
{
    public function __construct(
        private readonly ReservationCodeGenerator $codes,
        private readonly ReservationWorkflow $workflow,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $settings = CfgSetting::ensureDefaults();
        $filterFrom = $request->string('date_from')->toString() ?: now()->toDateString();
        $filterTo = $request->string('date_to')->toString() ?: $filterFrom;

        if ($filterFrom > $filterTo) {
            [$filterFrom, $filterTo] = [$filterTo, $filterFrom];
        }

        $filterStatus = $request->string('status')->toString();

        $query = Reservation::query()
            ->with('tables:id,number,area_id')
            ->whereBetween('date', [$filterFrom, $filterTo])
            ->orderBy('time')
            ->orderBy('customer_name');

        if ($filterStatus !== '' && in_array($filterStatus, Reservation::STATUSES, true)) {
            $query->where('status', $filterStatus);
        }

        $reservations = $query->get()->map(fn (Reservation $r): array => $this->serialize($r));

        $stats = [
            'total' => $reservations->count(),
            'pending' => $reservations->where('status', 'pending')->count(),
            'confirmed' => $reservations->where('status', 'confirmed')->count(),
            'seated' => $reservations->where('status', 'seated')->count(),
        ];

        $pendingApproval = $reservations
            ->filter(fn (array $row): bool => $row['needs_approval'])
            ->values();

        $timeline = $filterFrom === $filterTo
            ? $reservations
                ->groupBy(fn (array $row): string => substr($row['time'], 0, 2))
                ->sortKeys()
                ->map(fn ($group, $hour): array => [
                    'hour' => $hour,
                    'label' => sprintf('%s:00', $hour),
                    'reservations' => $group->values()->all(),
                ])
                ->values()
                ->all()
            : [];

        $waitingList = WaitingList::query()
            ->with('table:id,number')
            ->where('estado', 'esperando')
            ->orderBy('hora_llegada')
            ->get()
            ->map(fn (WaitingList $row): array => [
                'id' => $row->id,
                'cliente_nombre' => $row->cliente_nombre,
                'cliente_telefono' => $row->cliente_telefono,
                'num_personas' => $row->num_personas,
                'hora_llegada' => $row->hora_llegada?->toIso8601String(),
                'estado' => $row->estado,
                'notas' => $row->notas,
                'wait_minutes' => $row->hora_llegada
                    ? (int) $row->hora_llegada->diffInMinutes(now())
                    : 0,
            ]);

        $areas = RstArea::query()
            ->with(['tables' => fn ($q) => $q->where('active', true)->orderBy('number')])
            ->where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (RstArea $area): array => [
                'id' => $area->id,
                'name' => $area->name,
                'tables' => $area->tables->map(fn (RstTable $t): array => [
                    'id' => $t->id,
                    'number' => $t->number,
                    'capacity' => $t->capacity,
                    'status' => $t->status,
                ])->values(),
            ]);

        return Inertia::render('reservas/index', [
            'reservations' => $reservations,
            'pending_approval' => $pendingApproval,
            'timeline' => $timeline,
            'waiting_list' => $waitingList,
            'waiting_count' => $waitingList->count(),
            'areas' => $areas,
            'filters' => [
                'date_from' => $filterFrom,
                'date_to' => $filterTo,
                'status' => $filterStatus,
            ],
            'statuses' => Reservation::STATUSES,
            'sources' => Reservation::SOURCES,
            'stats' => $stats,
            'settings' => [
                'reservations_enabled' => $settings->reservations_enabled,
            ],
            'can' => [
                'manage' => $request->user()?->can('tenant.reservations.manage'),
            ],
        ]);
    }

    public function store(ReservationRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $source = $data['source'] ?? 'manual';

        $reservation = Reservation::query()->create([
            'code' => $this->codes->generate($source),
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'date' => $data['date'],
            'time' => $data['time'],
            'party_size' => $data['party_size'],
            'notes' => $data['notes'] ?? null,
            'source' => $source,
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        $tableIds = $data['table_ids'] ?? [];
        if ($tableIds !== []) {
            $this->workflow->syncTables($reservation, $tableIds);
        }

        return back()->with('success', __('messages.reservas.created'));
    }

    public function update(ReservationRequest $request, Reservation $reservation): RedirectResponse
    {
        abort_if(in_array($reservation->status, ['completed', 'no_show', 'cancelled_customer', 'cancelled_restaurant'], true), 403);

        $data = $request->validated();

        $reservation->update([
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'date' => $data['date'],
            'time' => $data['time'],
            'party_size' => $data['party_size'],
            'notes' => $data['notes'] ?? null,
        ]);

        $this->workflow->syncTables($reservation, $data['table_ids'] ?? []);

        return back()->with('success', __('messages.reservas.updated'));
    }

    public function confirm(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->workflow->confirm($reservation);

        return back()->with('success', __('messages.reservas.confirmed'));
    }

    public function reject(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->workflow->reject($reservation, $request->string('reason')->toString() ?: null);

        return back()->with('success', __('messages.reservas.rejected'));
    }

    public function seat(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $data = $request->validate([
            'table_ids' => ['nullable', 'array'],
            'table_ids.*' => ['uuid', Rule::exists(RstTable::class, 'id')],
        ]);

        $tableIds = $data['table_ids'] ?? [];
        if ($tableIds !== []) {
            $this->workflow->syncTables($reservation, $tableIds);
        }

        $this->workflow->seat($reservation);

        return back()->with('success', __('messages.reservas.seated'));
    }

    public function complete(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->workflow->complete($reservation);

        return back()->with('success', __('messages.reservas.completed'));
    }

    public function noShow(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->workflow->markNoShow($reservation);

        return back()->with('success', __('messages.reservas.no_show_marked'));
    }

    public function cancel(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->workflow->cancel(
            $reservation,
            'restaurant',
            $request->string('reason')->toString() ?: null,
        );

        return back()->with('success', __('messages.reservas.cancelled'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Reservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'rsv_id' => $reservation->rsv_id,
            'code' => $reservation->code,
            'customer_name' => $reservation->customer_name,
            'customer_phone' => $reservation->customer_phone,
            'date' => $reservation->date?->toDateString(),
            'time' => ReservationWorkflow::formatTime($reservation->time),
            'party_size' => $reservation->party_size,
            'notes' => $reservation->notes,
            'source' => $reservation->source,
            'status' => $reservation->status,
            'needs_approval' => $reservation->needsApproval(),
            'tables' => $reservation->tables->map(fn (RstTable $t): array => [
                'id' => $t->id,
                'number' => $t->number,
            ])->values(),
        ];
    }
}
