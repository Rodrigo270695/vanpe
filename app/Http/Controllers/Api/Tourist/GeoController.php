<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Departamento;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Geo ubigeo para filtros de la app turista. */
class GeoController extends Controller
{
    public function departamentos(): JsonResponse
    {
        $rows = Departamento::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departamento $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function provincias(Request $request): JsonResponse
    {
        $departamentoId = (int) $request->query('departamento_id');

        abort_if($departamentoId < 1, 422, 'departamento_id requerido');

        $rows = Provincia::query()
            ->where('departamento_id', $departamentoId)
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Provincia $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function distritos(Request $request): JsonResponse
    {
        $provinciaId = (int) $request->query('provincia_id');

        abort_if($provinciaId < 1, 422, 'provincia_id requerido');

        $rows = Distrito::query()
            ->where('provincia_id', $provinciaId)
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Distrito $row): array => [
                'id' => $row->id,
                'name' => $row->name,
            ]);

        return response()->json(['data' => $rows]);
    }
}
