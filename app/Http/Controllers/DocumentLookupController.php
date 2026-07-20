<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Consulta de datos de una persona por su documento (RENIEC vía apiperu.dev).
 *
 * Actúa como proxy para no exponer el token de la API al frontend.
 */
class DocumentLookupController extends Controller
{
    public function dni(string $numero): JsonResponse
    {
        if (! preg_match('/^\d{8}$/', $numero)) {
            return response()->json([
                'success' => false,
                'message' => 'El DNI debe tener 8 dígitos.',
            ], 422);
        }

        $token = (string) config('services.apiperu.token');

        if ($token === '') {
            return response()->json([
                'success' => false,
                'message' => 'Servicio de consulta no configurado.',
            ], 503);
        }

        $base = rtrim((string) config('services.apiperu.base_url'), '/');

        try {
            $response = Http::acceptJson()
                ->withToken($token)
                ->timeout(12)
                ->post("{$base}/dni", ['dni' => $numero]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo conectar con el servicio de consulta.',
            ], 502);
        }

        if (! $response->successful() || $response->json('success') !== true) {
            return response()->json([
                'success' => false,
                'message' => $response->json('message')
                    ?? 'No se encontraron datos para ese DNI.',
            ], 404);
        }

        $data = (array) $response->json('data', []);

        return response()->json([
            'success' => true,
            'data' => [
                'document_number' => $numero,
                'first_name' => (string) ($data['nombres'] ?? ''),
                'paternal_surname' => (string) ($data['apellido_paterno'] ?? ''),
                'maternal_surname' => (string) ($data['apellido_materno'] ?? ''),
                'full_name' => (string) ($data['nombre_completo'] ?? ''),
            ],
        ]);
    }

    public function ruc(string $numero): JsonResponse
    {
        if (! preg_match('/^\d{11}$/', $numero)) {
            return response()->json([
                'success' => false,
                'message' => __('messages.fel.ruc_invalid'),
            ], 422);
        }

        try {
            $data = app(\App\Services\Integrations\ApiPeruRucService::class)->consultar($numero);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
