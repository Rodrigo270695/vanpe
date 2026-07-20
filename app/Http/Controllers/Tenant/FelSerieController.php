<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\FelDocument;
use App\Models\Tenant\FelSerie;
use App\Models\Tenant\Sale;
use App\Support\Fel\FelSeriePresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FelSerieController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        $series = FelSerie::query()
            ->orderBy('tipo_comprobante')
            ->orderBy('ambiente')
            ->orderBy('serie')
            ->get()
            ->map(fn (FelSerie $serie): array => FelSeriePresenter::serialize($serie));

        return Inertia::render('facturacion/series/index', [
            'series' => $series,
            'tipos' => [
                ['value' => FelSerie::TIPO_FACTURA, 'label' => 'Factura', 'hint' => 'F001'],
                ['value' => FelSerie::TIPO_BOLETA, 'label' => 'Boleta', 'hint' => 'B001'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        $data = $request->validate([
            'tipo_comprobante' => ['required', 'integer', 'in:1,2'],
            'serie' => ['required', 'string', 'size:4', 'regex:/^[A-Z0-9]{4}$/'],
            'ambiente' => ['required', 'string', 'in:sandbox,produccion'],
            'ultimo_correlativo' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['serie'] = strtoupper($data['serie']);

        $exists = FelSerie::query()
            ->where('tipo_comprobante', $data['tipo_comprobante'])
            ->where('serie', $data['serie'])
            ->where('ambiente', $data['ambiente'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'serie' => __('messages.fel.series_duplicate'),
            ]);
        }

        FelSerie::query()->create([
            'tipo_comprobante' => $data['tipo_comprobante'],
            'serie' => $data['serie'],
            'ambiente' => $data['ambiente'],
            'ultimo_correlativo' => $data['ultimo_correlativo'] ?? 0,
            'activo' => true,
            'es_predeterminada' => ! FelSerie::query()
                ->where('tipo_comprobante', $data['tipo_comprobante'])
                ->where('ambiente', $data['ambiente'])
                ->where('activo', true)
                ->where('es_predeterminada', true)
                ->exists(),
        ]);

        return back()->with('success', __('messages.fel.series_created'));
    }

    public function update(Request $request, FelSerie $felSerie): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        $data = $request->validate([
            'activo' => ['sometimes', 'boolean'],
            'ultimo_correlativo' => ['sometimes', 'integer', 'min:0'],
            'es_predeterminada' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('es_predeterminada', $data) && $data['es_predeterminada']) {
            if (! $felSerie->activo) {
                return back()->withErrors([
                    'general' => __('messages.fel.series_default_requires_active'),
                ]);
            }

            FelSerie::query()
                ->where('tipo_comprobante', $felSerie->tipo_comprobante)
                ->where('ambiente', $felSerie->ambiente)
                ->whereKeyNot($felSerie->id)
                ->update(['es_predeterminada' => false]);

            $data['es_predeterminada'] = true;
        }

        if (array_key_exists('activo', $data) && ! $data['activo'] && $felSerie->es_predeterminada) {
            $data['es_predeterminada'] = false;
        }

        if (array_key_exists('ultimo_correlativo', $data)) {
            $minimo = FelSeriePresenter::ultimoCorrelativoEmitido($felSerie);

            if ($felSerie->esProduccion() && $data['ultimo_correlativo'] < $minimo) {
                return back()->withErrors([
                    'ultimo_correlativo' => __('messages.fel.series_correlative_too_low', [
                        'min' => $minimo,
                    ]),
                ]);
            }
        }

        $felSerie->update($data);

        return back()->with('success', __('messages.fel.series_updated'));
    }

    public function destroy(Request $request, FelSerie $felSerie): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        if (FelSeriePresenter::tieneDocumentosProduccion($felSerie)) {
            return back()->withErrors([
                'general' => __('messages.fel.series_delete_blocked'),
            ]);
        }

        DB::transaction(function () use ($felSerie): void {
            $documentIds = $felSerie->documentos()->pluck('id');

            if ($documentIds->isNotEmpty()) {
                Sale::query()
                    ->whereIn('fel_document_id', $documentIds)
                    ->update([
                        'fel_document_id' => null,
                        'fel_estado' => 'sin_cpe',
                        'fel_serie_id' => null,
                    ]);

                FelDocument::query()
                    ->whereIn('id', $documentIds)
                    ->delete();
            }

            $felSerie->delete();
        });

        return back()->with('success', __('messages.fel.series_deleted'));
    }
}
