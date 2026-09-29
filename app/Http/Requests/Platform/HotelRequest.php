<?php

namespace App\Http\Requests\Platform;

use App\Models\Hotel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class HotelRequest extends FormRequest
{
    public const MIN_PHOTOS_TO_PUBLISH = 4;

    public const MAX_GALLERY = 12;

    public function authorize(): bool
    {
        return (bool) $this->user()?->can(
            $this->route('hotel') === null ? 'hotels.create' : 'hotels.update',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $hotelId = $this->route('hotel')?->id;

        return [
            'nombre' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:160', Rule::unique('hotels', 'slug')->ignore($hotelId)],
            'ruc' => ['required', 'digits:11'],
            'resumen' => ['nullable', 'string', 'max:300'],
            'descripcion' => ['nullable', 'string', 'max:10000'],
            'direccion' => ['required', 'string', 'max:255'],
            'referencia' => ['nullable', 'string', 'max:255'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'provincia_id' => ['nullable', 'integer', 'exists:provincias,id'],
            'distrito_id' => ['nullable', 'integer', 'exists:distritos,id'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'telefono_reservas' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'website' => ['nullable', 'string', 'max:200'],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],

            'tipos_habitacion' => ['required', 'array', 'min:1'],
            'tipos_habitacion.*' => [Rule::in(Hotel::TIPOS_HABITACION)],
            'precio_desde' => ['nullable', 'numeric', 'min:0'],
            'precio_hasta' => ['nullable', 'numeric', 'min:0'],
            'moneda' => ['nullable', 'string', 'size:3'],
            'clasificacion' => ['required', Rule::in(Hotel::CLASIFICACIONES)],

            'servicios' => ['required', 'array', 'min:1'],
            'servicios.*' => [Rule::in(Hotel::SERVICIOS)],
            'medios_pago' => ['required', 'array', 'min:1'],
            'medios_pago.*' => [Rule::in(Hotel::MEDIOS_PAGO)],

            'cover' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_cover' => ['boolean'],
            'gallery' => ['nullable', 'array', 'max:'.self::MAX_GALLERY],
            'gallery.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['uuid'],

            'sistema_reservas' => ['required', Rule::in(Hotel::SISTEMAS_RESERVA)],
            'interes_whatsapp' => ['required', Rule::in(Hotel::INTERES_WHATSAPP)],
            'redes_sociales' => ['required', 'array', 'min:1'],
            'redes_sociales.*' => [Rule::in(Hotel::REDES_SOCIALES)],
            'herramientas_interes' => ['nullable', 'array'],
            'herramientas_interes.*' => [Rule::in(Hotel::HERRAMIENTAS)],
            'mayor_reto' => ['nullable', 'string', 'max:3000'],
            'sugerencias' => ['nullable', 'string', 'max:3000'],

            'destacado' => ['boolean'],
            'estado' => ['required', Rule::in(Hotel::ESTADOS)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $desde = $this->input('precio_desde');
            $hasta = $this->input('precio_hasta');
            if (is_numeric($desde) && is_numeric($hasta) && (float) $hasta < (float) $desde) {
                $validator->errors()->add('precio_hasta', __('messages.hotels.price_range_invalid'));
            }

            if ($this->input('estado') !== Hotel::ESTADO_PUBLICADO) {
                return;
            }

            if (! filled($this->input('distrito_id'))) {
                $validator->errors()->add('distrito_id', __('messages.hotels.publish_location_required'));
            }

            if ($this->input('latitud') === null || $this->input('longitud') === null) {
                $validator->errors()->add('latitud', __('messages.hotels.publish_coords_required'));
            }

            /** @var Hotel|null $hotel */
            $hotel = $this->route('hotel');

            $hasCover = $this->hasFile('cover')
                || ($hotel !== null && filled($hotel->imagen_portada_url) && ! $this->boolean('remove_cover'));

            if (! $hasCover) {
                $validator->errors()->add('cover', __('messages.hotels.publish_cover_required'));

                return;
            }

            $removed = $this->input('remove_media_ids', []);
            $existing = $hotel !== null
                ? $hotel->media()->whereNotIn('id', is_array($removed) ? $removed : [])->count()
                : 0;
            $newFiles = is_array($this->file('gallery')) ? count($this->file('gallery')) : 0;

            if (1 + $existing + $newFiles < self::MIN_PHOTOS_TO_PUBLISH) {
                $validator->errors()->add('gallery', __('messages.hotels.publish_photos_required', [
                    'min' => self::MIN_PHOTOS_TO_PUBLISH,
                ]));
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
        $lists = [];
        foreach (['tipos_habitacion', 'servicios', 'medios_pago', 'redes_sociales', 'herramientas_interes', 'remove_media_ids'] as $key) {
            $value = $this->input($key, []);
            if (is_string($value)) {
                $value = explode(',', $value);
            }
            $lists[$key] = array_values(array_filter((array) $value, fn ($v) => $v !== null && $v !== ''));
        }

        $this->merge([
            ...$lists,
            'ruc' => preg_replace('/\D/', '', (string) $this->input('ruc', '')),
            'destacado' => $this->boolean('destacado'),
            'remove_cover' => $this->boolean('remove_cover'),
            'slug' => filled($this->input('slug')) ? Str::slug((string) $this->input('slug')) : null,
            'precio_desde' => $this->blankToNull('precio_desde'),
            'precio_hasta' => $this->blankToNull('precio_hasta'),
            'latitud' => $this->blankToNull('latitud'),
            'longitud' => $this->blankToNull('longitud'),
            'check_in' => $this->blankToNull('check_in'),
            'check_out' => $this->blankToNull('check_out'),
            'departamento_id' => $this->blankToNull('departamento_id'),
            'provincia_id' => $this->blankToNull('provincia_id'),
            'distrito_id' => $this->blankToNull('distrito_id'),
        ]);
    }

    private function blankToNull(string $key): mixed
    {
        $value = $this->input($key);

        return $value === '' || $value === null ? null : $value;
    }
}
