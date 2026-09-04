<?php

namespace App\Http\Requests\Platform;

use App\Models\TourEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TourEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can($this->ability());
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
            'cover' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_cover' => ['boolean'],
            'gallery' => ['nullable', 'array', 'max:8'],
            'gallery.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['uuid'],
            'sponsors' => ['nullable', 'array'],
            'sponsors.*.nombre' => ['required_with:sponsors', 'string', 'max:150'],
            'sponsors.*.tipo' => ['nullable', 'string', 'max:30'],
            'sponsors.*.website' => ['nullable', 'string', 'max:255'],
            'sponsors.*.logo_url' => ['nullable', 'string', 'max:500'],
            'sponsors.*.logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'sponsors.*.remove_logo' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if ($key !== null) {
            return $data;
        }

        if ($this->hasFile('cover')) {
            $data['cover'] = $this->file('cover');
        }

        $gallery = $this->file('gallery');
        if (is_array($gallery)) {
            $data['gallery'] = array_values(array_filter($gallery));
        }

        $removeMediaIds = $this->input('remove_media_ids', []);
        $data['remove_media_ids'] = array_values(array_filter(array_map('strval', is_array($removeMediaIds) ? $removeMediaIds : [])));

        $sponsors = $data['sponsors'] ?? [];
        if (is_array($sponsors)) {
            foreach ($sponsors as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $file = $this->file("sponsors.$index.logo");
                if ($file !== null) {
                    $sponsors[$index]['logo'] = $file;
                }
                $sponsors[$index]['remove_logo'] = $this->boolean("sponsors.$index.remove_logo");
            }
            $data['sponsors'] = array_values($sponsors);
        }

        return $data;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'destacado' => $this->boolean('destacado'),
            'remove_cover' => $this->boolean('remove_cover'),
            'departamento_id' => $this->filled('departamento_id')
                ? (int) $this->input('departamento_id')
                : null,
            'sort_order' => $this->filled('sort_order')
                ? (int) $this->input('sort_order')
                : 0,
        ]);
    }

    private function ability(): string
    {
        return $this->route('tour_event') === null
            ? 'events.create'
            : 'events.update';
    }
}
