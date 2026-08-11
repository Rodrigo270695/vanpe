<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\RsvReservation;
use App\Services\Tourist\TouristReservationService;
use App\Support\PublicMediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(
        private readonly TouristReservationService $reservations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $rows = RsvReservation::query()
            ->with(['restaurant:id,nombre,slug,portada_url,direccion,telefono,latitud,longitud'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('fecha')
            ->orderByDesc('hora')
            ->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => $rows->getCollection()->map(fn (RsvReservation $r): array => $this->serialize($r))->values(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'restaurant_id' => ['required', 'uuid', 'exists:pub_restaurants,id'],
            'fecha' => ['required', 'date', 'after_or_equal:today'],
            'hora' => ['required', 'date_format:H:i'],
            'num_personas' => ['required', 'integer', 'min:1', 'max:30'],
            'nombre_contacto' => ['required', 'string', 'max:120'],
            'telefono_contacto' => ['required', 'string', 'max:20'],
            'notas' => ['nullable', 'string', 'max:300'],
            'slot_id' => ['nullable', 'uuid', 'exists:pub_availability_slots,id'],
        ]);

        $reservation = $this->reservations->create($customer, $data);

        return response()->json([
            'data' => $this->serialize($reservation),
            'message' => 'Reserva creada.',
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $reservation = RsvReservation::query()
            ->with(['restaurant:id,nombre,slug,portada_url,direccion,telefono,latitud,longitud'])
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        return response()->json(['data' => $this->serialize($reservation)]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'motivo' => ['nullable', 'string', 'max:200'],
        ]);

        $reservation = RsvReservation::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $updated = $this->reservations->cancel($customer, $reservation, $data['motivo'] ?? null);

        return response()->json([
            'data' => $this->serialize($updated->load('restaurant:id,nombre,slug,portada_url,direccion,telefono,latitud,longitud')),
            'message' => 'Reserva cancelada.',
        ]);
    }

    public function arrive(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $reservation = RsvReservation::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $updated = $this->reservations->markArrived($customer, $reservation, [
            'lat' => isset($data['lat']) ? (float) $data['lat'] : null,
            'lng' => isset($data['lng']) ? (float) $data['lng'] : null,
        ]);

        return response()->json([
            'data' => $this->serialize($updated->load('restaurant:id,nombre,slug,portada_url,direccion,telefono,latitud,longitud')),
            'message' => 'Llegada registrada. Cuando termines, marca “Terminar visita”.',
        ]);
    }

    public function visit(Request $request, string $id): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $reservation = RsvReservation::query()
            ->where('customer_id', $customer->id)
            ->whereKey($id)
            ->firstOrFail();

        $updated = $this->reservations->markVisited($customer, $reservation);

        return response()->json([
            'data' => $this->serialize($updated->load('restaurant:id,nombre,slug,portada_url,direccion,telefono,latitud,longitud')),
            'message' => 'Visita terminada. Ya puedes dejar una reseña.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(RsvReservation $r): array
    {
        $windowOpen = $this->reservations->isVisitWindowOpen($r);

        $canArrive = $r->estado === RsvReservation::ESTADO_CONFIRMADA && $windowOpen;
        $canCompleteVisit = $r->estado === RsvReservation::ESTADO_SENTADA && $windowOpen;
        $canReview = $r->estado === RsvReservation::ESTADO_CUMPLIDA
            && $r->restaurant_id !== null;

        return [
            'id' => $r->id,
            'codigo' => $r->codigo,
            'fecha' => $r->fecha?->toDateString(),
            'hora' => substr((string) $r->hora, 0, 5),
            'num_personas' => $r->num_personas,
            'nombre_contacto' => $r->nombre_contacto,
            'telefono_contacto' => $r->telefono_contacto,
            'notas' => $r->notas,
            'estado' => $r->estado,
            'slot_id' => $r->slot_id,
            'cancelada_motivo' => $r->cancelada_motivo,
            'can_arrive' => $canArrive,
            'can_complete_visit' => $canCompleteVisit,
            /** @deprecated usar can_complete_visit */
            'can_visit' => $canCompleteVisit,
            'can_review' => $canReview,
            'created_at' => $r->created_at?->toIso8601String(),
            'restaurant' => $r->restaurant ? [
                'id' => $r->restaurant->id,
                'nombre' => $r->restaurant->nombre,
                'slug' => $r->restaurant->slug,
                'portada_url' => PublicMediaUrl::make($r->restaurant->portada_url),
                'direccion' => $r->restaurant->direccion,
                'telefono' => $r->restaurant->telefono,
                'latitud' => $r->restaurant->latitud !== null ? (float) $r->restaurant->latitud : null,
                'longitud' => $r->restaurant->longitud !== null ? (float) $r->restaurant->longitud : null,
            ] : null,
        ];
    }
}
