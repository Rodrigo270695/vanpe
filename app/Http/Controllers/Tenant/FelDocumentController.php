<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\FelDocument;
use App\Models\Tenant\FelSerie;
use App\Support\DateTime\ApiDateTime;
use App\Support\Fel\FelDocumentPresenter;
use App\Services\Fel\FelEmisionVentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FelDocumentController extends Controller
{
    public function __construct(
        private readonly FelEmisionVentaService $felEmision,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);

        $search = trim($request->string('search')->toString());
        $estado = $request->string('estado')->toString() ?: 'todos';

        $query = FelDocument::query()
            ->with(['sale:id,numero,tipo_comprobante,estado,fel_estado'])
            ->orderByRaw('COALESCE(emitido_at, created_at) DESC')
            ->orderByDesc('id');

        if ($estado !== 'todos' && in_array($estado, [
            FelDocument::ESTADO_EMITIDO,
            FelDocument::ESTADO_RECHAZADO,
            FelDocument::ESTADO_PENDIENTE,
            FelDocument::ESTADO_ANULADO,
        ], true)) {
            $query->where('estado', $estado);
        }

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($q) use ($like): void {
                $q->where('numero_completo', 'ILIKE', $like)
                    ->orWhere('receptor_nombre', 'ILIKE', $like)
                    ->orWhere('receptor_num_doc', 'ILIKE', $like)
                    ->orWhereHas('sale', fn ($sq) => $sq->where('numero', 'ILIKE', $like));
            });
        }

        $documents = $query
            ->paginate(20)
            ->withQueryString()
            ->through(function (FelDocument $doc): array {
                $presented = FelDocumentPresenter::forList($doc);

                return [
                    ...$presented,
                    'tipo_comprobante' => $doc->tipo_comprobante,
                    'tipo_label' => FelSerie::labelTipo($doc->tipo_comprobante),
                    'receptor_nombre' => $doc->receptor_nombre,
                    'receptor_num_doc' => $doc->receptor_num_doc,
                    'total' => (float) $doc->total,
                    'sale' => $doc->sale ? [
                        'id' => $doc->sale->id,
                        'numero' => $doc->sale->numero,
                    ] : null,
                ];
            });

        return Inertia::render('facturacion/documentos/index', [
            'documents' => $documents,
            'filters' => [
                'search' => $search,
                'estado' => $estado,
            ],
            'can' => [
                'reemit' => (bool) $request->user()?->can('tenant.invoicing.manage'),
            ],
        ]);
    }

    public function reemit(Request $request, FelDocument $felDocument): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.invoicing.manage'), 403);
        abort_unless(FelDocumentPresenter::puedeReemitir($felDocument), 422);

        $sale = $felDocument->sale;
        abort_if($sale === null, 404);

        try {
            $this->felEmision->emitir($sale);
        } catch (\Throwable $e) {
            return back()->withErrors(['fel' => $e->getMessage()]);
        }

        $sale->refresh()->load('felDocument');

        if ($sale->fel_estado === 'emitido') {
            return back()->with('success', __('messages.fel.reemit_success', [
                'number' => $sale->felDocument?->numero_completo ?? '',
            ]));
        }

        $motivo = $sale->felDocument?->error_mensaje;

        return back()->with(
            'warning',
            filled($motivo)
                ? __('messages.fel.reemit_failed_reason', ['reason' => $motivo])
                : __('messages.fel.reemit_failed'),
        );
    }

    public function downloadXml(FelDocument $felDocument): StreamedResponse
    {
        abort_unless(auth()->user()?->can('tenant.invoicing.manage'), 403);
        abort_unless(filled($felDocument->url_xml), 404);

        return $this->proxyDownload($felDocument->url_xml, $felDocument->numero_completo.'.xml');
    }

    public function downloadCdr(FelDocument $felDocument): StreamedResponse
    {
        abort_unless(auth()->user()?->can('tenant.invoicing.manage'), 403);
        abort_unless(filled($felDocument->url_cdr), 404);

        return $this->proxyDownload($felDocument->url_cdr, 'R-'.$felDocument->numero_completo.'.xml');
    }

    public function json(FelDocument $felDocument): JsonResponse
    {
        abort_unless(auth()->user()?->can('tenant.invoicing.manage'), 403);

        $payload = $felDocument->apisunat_payload;

        if (! is_array($payload)) {
            $payload = [
                'numero_completo' => $felDocument->numero_completo,
                'tipo_comprobante' => $felDocument->tipo_comprobante,
                'tipo_label' => FelSerie::labelTipo($felDocument->tipo_comprobante),
                'estado' => $felDocument->estado,
                'receptor' => [
                    'tipo_doc' => $felDocument->receptor_tipo_doc,
                    'num_doc' => $felDocument->receptor_num_doc,
                    'nombre' => $felDocument->receptor_nombre,
                ],
                'totales' => [
                    'subtotal' => (string) $felDocument->subtotal,
                    'igv_monto' => (string) $felDocument->igv_monto,
                    'total' => (string) $felDocument->total,
                    'moneda' => $felDocument->moneda,
                ],
                'enlaces' => [
                    'pdf' => $felDocument->url_pdf,
                    'xml' => $felDocument->url_xml,
                    'cdr' => $felDocument->url_cdr,
                    'consulta' => $felDocument->enlace_consulta,
                ],
                'emitido_at' => ApiDateTime::toUtcIso($felDocument->emitido_at),
                'sale_id' => $felDocument->sale_id,
                'nota' => 'Respuesta completa de APISUNAT no disponible para comprobantes emitidos antes de esta versión.',
            ];
        }

        return response()->json($payload, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function proxyDownload(string $url, string $filename): StreamedResponse
    {
        $response = Http::timeout(30)->get($url);
        abort_unless($response->successful(), 502);

        return response()->streamDownload(
            static function () use ($response): void {
                echo $response->body();
            },
            $filename,
            ['Content-Type' => $response->header('Content-Type', 'application/xml')],
        );
    }
}
