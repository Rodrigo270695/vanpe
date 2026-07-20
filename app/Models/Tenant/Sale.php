<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasUuids;

    public const STATUSES = ['pendiente', 'pagada', 'anulada'];

    protected $connection = 'tenant';

    protected $table = 'sales';

    public const COMPROBANTE_TYPES = ['nota_venta', 'boleta', 'factura'];

    public const FEL_STATES = ['sin_cpe', 'pendiente_emision', 'emitido', 'rechazado', 'anulado'];

    protected $fillable = [
        'numero',
        'order_id',
        'cash_session_id',
        'cajero_id',
        'subtotal',
        'igv',
        'descuento',
        'total',
        'estado',
        'tipo_comprobante',
        'fel_estado',
        'fel_document_id',
        'fel_serie_id',
        'cliente_tipo_doc',
        'cliente_num_doc',
        'cliente_nombre',
        'cliente_direccion',
        'anulada_en',
        'anulado_por',
        'motivo_anulacion',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'igv' => 'decimal:2',
            'descuento' => 'decimal:2',
            'total' => 'decimal:2',
            'cliente_tipo_doc' => 'integer',
            'anulada_en' => 'datetime',
        ];
    }

    public function requiresFel(): bool
    {
        return in_array($this->tipo_comprobante, ['boleta', 'factura'], true);
    }

    public function isPaid(): bool
    {
        return $this->estado === 'pagada';
    }

    public function isVoided(): bool
    {
        return $this->estado === 'anulada';
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /** @return BelongsTo<CashSession, $this> */
    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class, 'cash_session_id');
    }

    /** @return BelongsTo<User, $this> */
    public function cajero(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cajero_id');
    }

    /** @return BelongsTo<User, $this> */
    public function anuladoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'anulado_por');
    }

    /** @return HasMany<SaleItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    /** @return BelongsTo<FelDocument, $this> */
    public function felDocument(): BelongsTo
    {
        return $this->belongsTo(FelDocument::class, 'fel_document_id');
    }

    /** @return BelongsTo<FelSerie, $this> */
    public function felSerie(): BelongsTo
    {
        return $this->belongsTo(FelSerie::class, 'fel_serie_id');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'sale_id');
    }
}
