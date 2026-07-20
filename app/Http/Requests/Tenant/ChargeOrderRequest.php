<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChargeOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('tenant.sales.manage');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tipo = $this->string('tipo_comprobante')->toString() ?: 'nota_venta';

        return [
            'metodo' => ['required', 'string', Rule::in(['efectivo', 'tarjeta', 'yape', 'plin'])],
            'referencia' => ['nullable', 'string', 'max:100'],
            'monto_recibido' => ['nullable', 'numeric', 'min:0'],
            'tipo_comprobante' => ['required', 'string', Rule::in(Sale::COMPROBANTE_TYPES)],
            'cliente_tipo_doc' => ['nullable', 'integer', Rule::in([1, 4, 6, 7])],
            'cliente_num_doc' => [
                Rule::requiredIf($tipo === 'factura'),
                'nullable',
                'string',
                'max:15',
            ],
            'cliente_nombre' => [
                Rule::requiredIf($tipo === 'factura'),
                'nullable',
                'string',
                'max:200',
            ],
            'cliente_direccion' => ['nullable', 'string', 'max:250'],
        ];
    }
}
