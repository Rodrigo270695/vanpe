<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Services\Platform\HotelCatalogQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    public function __construct(
        private readonly HotelCatalogQuery $catalog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $servicios = $request->input('servicios', []);
        if (is_string($servicios)) {
            $servicios = explode(',', $servicios);
        }

        $paginator = $this->catalog->list(
            $request->integer('departamento_id') ?: null,
            $request->integer('provincia_id') ?: null,
            $request->integer('distrito_id') ?: null,
            $request->string('q')->toString() ?: null,
            $request->string('clasificacion')->toString() ?: null,
            array_map('strval', (array) $servicios),
            min($request->integer('per_page', 12), 50),
        );

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (Hotel $hotel): array => $this->catalog->toListItem($hotel))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $hotel = $this->catalog->findBySlug($slug);

        abort_if($hotel === null, 404);

        return response()->json([
            'data' => $this->catalog->toDetail($hotel),
        ]);
    }
}
