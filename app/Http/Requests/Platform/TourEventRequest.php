<?php

namespace App\Http\Requests\Platform;

use App\Models\TourEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TourEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can(
            $this->isMethod('POST') ? 'events.create' : 'events.update'
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200'],
            'resumen' => ['nullable', 'string', 'max:500'],
            'descripcion' => ['nullable', 'string', 'max:10000'],
            'portada_url' => ['nullable', 'string', 'max:500'],
            'lugar' => ['nullable', 'string', 'max:255'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'provincia_id' => ['nullable', 'integer', 'exists:provincias,id'],
            'distrito_id' => ['nullable', 'integer', 'exists:distritos,id'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'estado' => ['required', Rule::in([
                TourEvent::ESTADO_BORRADOR,
                TourEvent::ESTADO_PUBLICADO,
                TourEvent::ESTADO_ARCHIVADO,
            ])],
            'destacado' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'sponsors' => ['nullable', 'array'],
            'sponsors.*.nombre' => ['required_with:sponsors', 'string', 'max:150'],
            'sponsors.*.tipo' => ['nullable', 'string', 'max:30'],
            'sponsors.*.logo_url' => ['nullable', 'string', 'max:500'],
            'sponsors.*.website' => ['nullable', 'string', 'max:255'],
        ];
    }
}
