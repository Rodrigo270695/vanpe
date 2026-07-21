<?php

namespace App\Http\Requests\Platform;

use App\Models\RefCatalogItem;
use App\Models\TourSpot;
use App\Support\RefCatalogTypes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TourSpotRequest extends FormRequest
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
        $spotId = $this->route('tour_spot')?->id;

        return [
            'nombre' => ['required', 'string', 'max:150'],
            'slug' => [
                'nullable',
                'string',
                'max:160',
                Rule::unique('tour_spots', 'slug')->ignore($spotId),
            ],
            'resumen' => ['nullable', 'string', 'max:300'],
            'descripcion' => ['nullable', 'string', 'max:10000'],
            'departamento_id' => ['required', 'integer', 'exists:departamentos,id'],
            'provincia_id' => ['required', 'integer', 'exists:provincias,id'],
            'distrito_id' => ['required', 'integer', 'exists:distritos,id'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'referencia' => ['nullable', 'string', 'max:255'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'website' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email', 'max:150'],
            'es_gratuito' => ['boolean'],
            'precio_entrada_desde' => ['nullable', 'numeric', 'min:0'],
            'precio_entrada_hasta' => ['nullable', 'numeric', 'min:0'],
            'moneda' => ['nullable', 'string', 'size:3'],
            'requiere_reserva' => ['boolean'],
            'dificultad_acceso' => ['required', Rule::in(TourSpot::DIFICULTADES)],
            'vialidad_principal' => ['nullable', 'string', 'max:80'],
            'tiempo_acceso_min' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'distancia_acceso_km' => ['nullable', 'numeric', 'min:0'],
            'acceso_notas' => ['nullable', 'string', 'max:2000'],
            'estacionamiento' => ['required', Rule::in(TourSpot::ESTACIONAMIENTOS)],
            'accesible_movilidad_reducida' => ['nullable', 'boolean'],
            'mejor_epoca' => ['nullable', 'string', 'max:120'],
            'duracion_visita_min' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'horario_texto' => ['nullable', 'string', 'max:200'],
            'tips' => ['nullable', 'array', 'max:8'],
            'tips.*' => ['string', 'max:120'],
            'imagen_portada_url' => ['nullable', 'string', 'max:500'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_cover' => ['boolean'],
            'gallery' => ['nullable', 'array', 'max:8'],
            'gallery.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['uuid'],
            'destacado' => ['boolean'],
            'estado' => ['required', Rule::in(TourSpot::ESTADOS)],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['uuid', 'exists:tour_categories,id'],
            'primary_category_id' => ['nullable', 'uuid', 'exists:tour_categories,id'],
            'access_mode_ids' => ['nullable', 'array'],
            'access_mode_ids.*' => [
                'uuid',
                Rule::exists('ref_catalog_items', 'id')->where('type', RefCatalogTypes::TOUR_ACCESS),
            ],
            'hours' => ['nullable', 'array'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'hours.*.opens_at' => ['nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['nullable', 'date_format:H:i'],
            'hours.*.active' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('estado') !== TourSpot::ESTADO_PUBLICADO) {
                return;
            }

            if ($this->input('latitud') === null || $this->input('longitud') === null) {
                $validator->errors()->add('latitud', __('messages.tour_spots.publish_coords_required'));
            }

            $categories = $this->input('category_ids', []);
            if (! is_array($categories) || count($categories) < 1) {
                $validator->errors()->add('category_ids', __('messages.tour_spots.publish_category_required'));
            }

            $spot = $this->route('tour_spot');
            $hasCover = $this->hasFile('cover')
                || (filled($this->input('imagen_portada_url')) && ! $this->boolean('remove_cover'))
                || ($spot instanceof TourSpot
                    && filled($spot->imagen_portada_url)
                    && ! $this->boolean('remove_cover'));

            if (! $hasCover) {
                $validator->errors()->add('cover', __('messages.tour_spots.publish_cover_required'));
            }

            if (! filled($this->input('resumen'))) {
                $validator->errors()->add('resumen', __('messages.tour_spots.publish_summary_required'));
            }

            $access = $this->input('access_mode_ids', []);
            if (! is_array($access) || count($access) < 1) {
                $validator->errors()->add('access_mode_ids', __('messages.tour_spots.publish_access_required'));
            }

            if (! filled($this->input('vialidad_principal')) && ! filled($this->input('acceso_notas'))) {
                $validator->errors()->add('vialidad_principal', __('messages.tour_spots.publish_road_required'));
            }

            $vialidad = $this->input('vialidad_principal');
            if (filled($vialidad)) {
                $exists = RefCatalogItem::query()
                    ->where('type', RefCatalogTypes::TOUR_ROAD)
                    ->where('slug', $vialidad)
                    ->where('active', true)
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add('vialidad_principal', __('messages.tour_spots.invalid_road'));
                }
            }
        });
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

        return $data;
    }

    protected function prepareForValidation(): void
    {
        $tips = $this->input('tips');
        if (is_string($tips)) {
            $tips = array_values(array_filter(array_map(
                static fn (string $line): string => trim($line),
                preg_split('/\r\n|\r|\n/', $tips) ?: [],
            )));
        }

        $categoryIds = $this->input('category_ids', []);
        if (is_string($categoryIds)) {
            $categoryIds = array_filter(explode(',', $categoryIds));
        }

        $accessIds = $this->input('access_mode_ids', []);
        if (is_string($accessIds)) {
            $accessIds = array_filter(explode(',', $accessIds));
        }

        $removeMediaIds = $this->input('remove_media_ids', []);
        if (is_string($removeMediaIds)) {
            $removeMediaIds = array_filter(explode(',', $removeMediaIds));
        }

        $hours = $this->input('hours', []);
        if (is_array($hours)) {
            foreach ($hours as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $hours[$index]['active'] = filter_var($row['active'] ?? false, FILTER_VALIDATE_BOOLEAN);
            }
        }

        $this->merge([
            'es_gratuito' => $this->boolean('es_gratuito'),
            'requiere_reserva' => $this->boolean('requiere_reserva'),
            'destacado' => $this->boolean('destacado'),
            'remove_cover' => $this->boolean('remove_cover'),
            'slug' => filled($this->input('slug'))
                ? Str::slug((string) $this->input('slug'))
                : null,
            'tips' => $tips,
            'category_ids' => array_values($categoryIds ?: []),
            'access_mode_ids' => array_values($accessIds ?: []),
            'remove_media_ids' => array_values($removeMediaIds ?: []),
            'hours' => $hours,
            'precio_entrada_desde' => $this->blankToNull('precio_entrada_desde'),
            'precio_entrada_hasta' => $this->blankToNull('precio_entrada_hasta'),
            'latitud' => $this->blankToNull('latitud'),
            'longitud' => $this->blankToNull('longitud'),
            'tiempo_acceso_min' => $this->blankToNull('tiempo_acceso_min'),
            'distancia_acceso_km' => $this->blankToNull('distancia_acceso_km'),
            'duracion_visita_min' => $this->blankToNull('duracion_visita_min'),
            'accesible_movilidad_reducida' => $this->has('accesible_movilidad_reducida')
                ? $this->boolean('accesible_movilidad_reducida')
                : null,
            'primary_category_id' => filled($this->input('primary_category_id'))
                ? $this->input('primary_category_id')
                : null,
            'vialidad_principal' => filled($this->input('vialidad_principal'))
                ? $this->input('vialidad_principal')
                : null,
        ]);
    }

    private function blankToNull(string $key): mixed
    {
        $value = $this->input($key);

        return $value === '' || $value === null ? null : $value;
    }

    private function ability(): string
    {
        return $this->route('tour_spot') === null
            ? 'tour_spots.create'
            : 'tour_spots.update';
    }
}
