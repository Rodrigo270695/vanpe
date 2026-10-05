<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hotel extends Model
{
    use HasUuids, SoftDeletes;

    public const ESTADO_BORRADOR = 'borrador';

    public const ESTADO_PUBLICADO = 'publicado';

    public const ESTADO_PAUSADO = 'pausado';

    public const ESTADO_ARCHIVADO = 'archivado';

    public const ESTADOS = [
        self::ESTADO_BORRADOR,
        self::ESTADO_PUBLICADO,
        self::ESTADO_PAUSADO,
        self::ESTADO_ARCHIVADO,
    ];

    public const TIPOS_HABITACION = ['matrimonial', 'doble', 'individual', 'familiar', 'suite'];

    public const CLASIFICACIONES = [
        '1_estrella',
        '2_estrellas',
        '3_estrellas',
        '4_estrellas',
        '5_estrellas',
        'sin_categoria',
    ];

    public const SERVICIOS = [
        'wifi',
        'desayuno',
        'aire_acondicionado',
        'agua_caliente',
        'estacionamiento',
        'piscina',
        'custodia_equipaje',
        'pet_friendly',
        'recepcion_24h',
        'television',
        'bar_restaurant',
        'casino',
        'ascensor',
    ];

    public const MEDIOS_PAGO = ['efectivo', 'yape_plin', 'tarjeta', 'transferencia'];

    public const SISTEMAS_RESERVA = ['cuaderno', 'excel', 'software', 'whatsapp'];

    public const INTERES_WHATSAPP = ['si', 'mas_info', 'no'];

    public const REDES_SOCIALES = [
        'facebook',
        'instagram',
        'tiktok',
        'whatsapp_business',
        'ota',
        'web_propia',
        'ninguna',
    ];

    public const HERRAMIENTAS = [
        'reservas_whatsapp',
        'calendario_ocupacion',
        'boletas_facturas',
        'promociones',
        'reportes',
    ];

    protected $fillable = [
        'tenant_id',
        'departamento_id',
        'provincia_id',
        'distrito_id',
        'nombre',
        'slug',
        'ruc',
        'resumen',
        'descripcion',
        'direccion',
        'referencia',
        'latitud',
        'longitud',
        'telefono_reservas',
        'email',
        'website',
        'check_in',
        'check_out',
        'tipos_habitacion',
        'precio_desde',
        'precio_hasta',
        'moneda',
        'clasificacion',
        'servicios',
        'medios_pago',
        'imagen_portada_url',
        'sistema_reservas',
        'interes_whatsapp',
        'redes_sociales',
        'herramientas_interes',
        'mayor_reto',
        'sugerencias',
        'rating_promedio',
        'total_resenas',
        'destacado',
        'score_ranking',
        'estado',
        'publicado_en',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'decimal:6',
            'longitud' => 'decimal:6',
            'tipos_habitacion' => 'array',
            'precio_desde' => 'decimal:2',
            'precio_hasta' => 'decimal:2',
            'servicios' => 'array',
            'medios_pago' => 'array',
            'redes_sociales' => 'array',
            'herramientas_interes' => 'array',
            'rating_promedio' => 'decimal:2',
            'total_resenas' => 'integer',
            'destacado' => 'boolean',
            'score_ranking' => 'decimal:4',
            'publicado_en' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function provincia(): BelongsTo
    {
        return $this->belongsTo(Provincia::class);
    }

    public function distrito(): BelongsTo
    {
        return $this->belongsTo(Distrito::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(HotelMedia::class)->orderBy('sort_order');
    }

    /** Número de estrellas (1–5) o null si no está categorizado. */
    public function estrellas(): ?int
    {
        $n = (int) $this->clasificacion;

        return $n >= 1 && $n <= 5 ? $n : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        $media = $this->relationLoaded('media')
            ? $this->media->map(fn (HotelMedia $item): array => [
                'id' => $item->id,
                'url' => $item->url,
                'caption' => $item->caption,
                'sort_order' => $item->sort_order,
                'is_cover' => $item->is_cover,
            ])->values()->all()
            : [];

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'tenant_name' => $this->relationLoaded('tenant') ? $this->tenant?->nombre_comercial : null,
            'tenant_slug' => $this->relationLoaded('tenant') ? $this->tenant?->slug : null,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'ruc' => $this->ruc,
            'resumen' => $this->resumen,
            'descripcion' => $this->descripcion,
            'departamento_id' => $this->departamento_id,
            'provincia_id' => $this->provincia_id,
            'distrito_id' => $this->distrito_id,
            'departamento_name' => $this->departamento?->name,
            'provincia_name' => $this->provincia?->name,
            'distrito_name' => $this->distrito?->name,
            'direccion' => $this->direccion,
            'referencia' => $this->referencia,
            'latitud' => $this->latitud !== null ? (float) $this->latitud : null,
            'longitud' => $this->longitud !== null ? (float) $this->longitud : null,
            'telefono_reservas' => $this->telefono_reservas,
            'email' => $this->email,
            'website' => $this->website,
            'check_in' => $this->check_in,
            'check_out' => $this->check_out,
            'tipos_habitacion' => $this->tipos_habitacion ?? [],
            'precio_desde' => $this->precio_desde !== null ? (float) $this->precio_desde : null,
            'precio_hasta' => $this->precio_hasta !== null ? (float) $this->precio_hasta : null,
            'moneda' => $this->moneda,
            'clasificacion' => $this->clasificacion,
            'servicios' => $this->servicios ?? [],
            'medios_pago' => $this->medios_pago ?? [],
            'imagen_portada_url' => $this->imagen_portada_url,
            'sistema_reservas' => $this->sistema_reservas,
            'interes_whatsapp' => $this->interes_whatsapp,
            'redes_sociales' => $this->redes_sociales ?? [],
            'herramientas_interes' => $this->herramientas_interes ?? [],
            'mayor_reto' => $this->mayor_reto,
            'sugerencias' => $this->sugerencias,
            'destacado' => $this->destacado,
            'estado' => $this->estado,
            'publicado_en' => $this->publicado_en?->toIso8601String(),
            'media' => $media,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
