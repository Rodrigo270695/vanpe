<?php

namespace App\Services\Tenant;

use App\Models\Tenant\CashSession;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Sale;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashSessionService
{
    public function getOpenSession(): ?CashSession
    {
        return CashSession::query()
            ->where('estado', 'abierta')
            ->with('cajero:id,name')
            ->first();
    }

    public function open(User $cajero, float $montoApertura): CashSession
    {
        if ($montoApertura < 0) {
            throw ValidationException::withMessages([
                'monto_apertura' => __('messages.caja.invalid_opening_amount'),
            ]);
        }

        if ($this->getOpenSession() !== null) {
            throw ValidationException::withMessages([
                'session' => __('messages.caja.session_already_open'),
            ]);
        }

        return CashSession::query()->create([
            'cajero_id' => $cajero->id,
            'monto_apertura' => $montoApertura,
            'estado' => 'abierta',
            'abierta_en' => now(),
        ]);
    }

    /**
     * @return array{
     *     total_ventas: float,
     *     efectivo: float,
     *     tarjeta: float,
     *     yape: float,
     *     plin: float,
     *     transferencia: float,
     *     ventas_count: int
     * }
     */
    public function summarize(CashSession $session): array
    {
        $payments = Payment::query()
            ->whereHas('sale', fn ($query) => $query
                ->where('cash_session_id', $session->id)
                ->where('estado', 'pagada'))
            ->get(['metodo', 'monto']);

        $byMethod = [
            'efectivo' => 0.0,
            'tarjeta' => 0.0,
            'yape' => 0.0,
            'plin' => 0.0,
            'transferencia' => 0.0,
        ];

        foreach ($payments as $payment) {
            if (array_key_exists($payment->metodo, $byMethod)) {
                $byMethod[$payment->metodo] += (float) $payment->monto;
            }
        }

        $totalVentas = (float) Sale::query()
            ->where('cash_session_id', $session->id)
            ->where('estado', 'pagada')
            ->sum('total');

        $ventasCount = Sale::query()
            ->where('cash_session_id', $session->id)
            ->where('estado', 'pagada')
            ->count();

        return [
            'total_ventas' => round($totalVentas, 2),
            'efectivo' => round($byMethod['efectivo'], 2),
            'tarjeta' => round($byMethod['tarjeta'], 2),
            'yape' => round($byMethod['yape'], 2),
            'plin' => round($byMethod['plin'], 2),
            'transferencia' => round($byMethod['transferencia'], 2),
            'ventas_count' => $ventasCount,
        ];
    }

    public function close(CashSession $session, float $montoCierre, ?string $notas = null): CashSession
    {
        if (! $session->isOpen()) {
            throw ValidationException::withMessages([
                'session' => __('messages.caja.session_not_open'),
            ]);
        }

        if ($montoCierre < 0) {
            throw ValidationException::withMessages([
                'monto_cierre' => __('messages.caja.invalid_closing_amount'),
            ]);
        }

        return DB::transaction(function () use ($session, $montoCierre, $notas): CashSession {
            $summary = $this->summarize($session);
            $montoEsperado = round((float) $session->monto_apertura + $summary['efectivo'], 2);
            $diferencia = round($montoCierre - $montoEsperado, 2);

            $session->update([
                'monto_cierre' => $montoCierre,
                'monto_esperado_efectivo' => $montoEsperado,
                'diferencia' => $diferencia,
                'total_ventas' => $summary['total_ventas'],
                'notas_cierre' => $notas,
                'estado' => 'cerrada',
                'cerrada_en' => now(),
            ]);

            return $session->fresh(['cajero:id,name']);
        });
    }
}
