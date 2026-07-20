<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FelDocument extends Model
{
    use HasUuids;

    public const ESTADO_PENDIENTE = 'pendiente';

    public const ESTADO_EMITIDO = 'emitido';

    public const ESTADO_RECHAZADO = 'rechazado';

    public const ESTADO_ANULADO = 'anulado';

    protected $connection = 'tenant';

    protected $table = 'fel_documents';

    protected $fillable = [
        'sale_id',
        'fel_serie_id',
        'tipo_comprobante',
        'serie',
        'correlativo',
        'numero_completo',
        'receptor_tipo_doc',
        'receptor_num_doc',
        'receptor_nombre',
        'subtotal',
        'igv_monto',
        'total',
        'moneda',
        'estado',
        'proveedor_ref',
        'url_pdf',
        'url_xml',
        'url_cdr',
        'enlace_consulta',
        'apisunat_payload',
        'apisunat_mode',
        'error_mensaje',
        'emitido_at',
        'anulado_at',
    ];

    protected function casts(): array
    {
        return [
            'tipo_comprobante' => 'integer',
            'correlativo' => 'integer',
            'receptor_tipo_doc' => 'integer',
            'subtotal' => 'decimal:2',
            'igv_monto' => 'decimal:2',
            'total' => 'decimal:2',
            'apisunat_payload' => 'array',
            'emitido_at' => 'datetime',
            'anulado_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    /** @return BelongsTo<FelSerie, $this> */
    public function felSerie(): BelongsTo
    {
        return $this->belongsTo(FelSerie::class, 'fel_serie_id');
    }
}
