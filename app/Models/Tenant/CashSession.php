<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use HasUuids;

    public const STATUSES = ['abierta', 'cerrada'];

    protected $connection = 'tenant';

    protected $table = 'cash_sessions';

    protected $fillable = [
        'cajero_id',
        'monto_apertura',
        'monto_cierre',
        'monto_esperado_efectivo',
        'diferencia',
        'total_ventas',
        'estado',
        'notas_cierre',
        'abierta_en',
        'cerrada_en',
    ];

    protected function casts(): array
    {
        return [
            'monto_apertura' => 'decimal:2',
            'monto_cierre' => 'decimal:2',
            'monto_esperado_efectivo' => 'decimal:2',
            'diferencia' => 'decimal:2',
            'total_ventas' => 'decimal:2',
            'abierta_en' => 'datetime',
            'cerrada_en' => 'datetime',
        ];
    }

    public function isOpen(): bool
    {
        return $this->estado === 'abierta';
    }

    /** @return BelongsTo<User, $this> */
    public function cajero(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cajero_id');
    }

    /** @return HasMany<Sale, $this> */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'cash_session_id');
    }
}
