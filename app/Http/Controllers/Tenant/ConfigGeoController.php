<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Distrito;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Cascada ubigeo para Mi negocio (sesión tenant). */
class ConfigGeoController extends Controller
{
    public function provincias(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.settings.manage'), 403);

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
        abort_unless((bool) $request->user()?->can('tenant.settings.manage'), 403);

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
