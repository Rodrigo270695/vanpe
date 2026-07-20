<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;

    public const METHODS = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];

    public $timestamps = false;

    protected $connection = 'tenant';

    protected $table = 'payments';

    protected $fillable = [
        'sale_id',
        'cajero_id',
        'metodo',
        'monto',
        'monto_recibido',
        'referencia',
        'recibido_en',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'monto_recibido' => 'decimal:2',
            'recibido_en' => 'datetime',
        ];
    }

    public function isCash(): bool
    {
        return $this->metodo === 'efectivo';
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    /** @return BelongsTo<User, $this> */
    public function cajero(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cajero_id');
    }
}
