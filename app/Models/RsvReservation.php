<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RsvReservation extends Model
{
    use HasUuids;

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_CONFIRMADA = 'confirmada';

    public const ESTADO_SENTADA = 'sentada';

    public const ESTADO_CUMPLIDA = 'cumplida';

    public const ESTADO_NO_SHOW = 'no_show';

    public const ESTADO_CANCELADA_CLIENTE = 'cancelada_cliente';

    public const ESTADO_CANCELADA_RESTAURANTE = 'cancelada_restaurante';

    public const ESTADOS_ACTIVOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CONFIRMADA,
        self::ESTADO_SENTADA,
    ];

    public const ESTADOS_CANCELABLES = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CONFIRMADA,
    ];

    protected $table = 'rsv_reservations';

    protected $fillable = [
        'codigo',
        'customer_id',
        'tenant_id',
        'restaurant_id',
        'fecha',
        'hora',
        'num_personas',
        'nombre_contacto',
        'telefono_contacto',
        'notas',
        'estado',
        'slot_id',
        'comision_aplicada',
        'comision_estado',
        'confirmada_en',
        'cancelada_en',
        'cancelada_motivo',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'num_personas' => 'integer',
            'comision_aplicada' => 'decimal:2',
            'confirmada_en' => 'datetime',
            'cancelada_en' => 'datetime',
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return BelongsTo<PubRestaurant, $this> */
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(PubRestaurant::class, 'restaurant_id');
    }

    /** @return BelongsTo<PubAvailabilitySlot, $this> */
    public function slot(): BelongsTo
    {
        return $this->belongsTo(PubAvailabilitySlot::class, 'slot_id');
    }

    /** @return HasMany<RsvReservationEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(RsvReservationEvent::class, 'reservation_id');
    }

    public function isCancelableByCustomer(): bool
    {
        return in_array($this->estado, self::ESTADOS_CANCELABLES, true);
    }
}
