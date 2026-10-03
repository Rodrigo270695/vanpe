<?php

namespace App\Http\Requests\Platform;

use App\Models\Distrito;
use App\Models\Hotel;
use App\Models\Provincia;
use App\Rules\PeruMobilePhone;
use App\Rules\PeruRuc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class HotelRequest extends FormRequest
{
    public const MIN_PHOTOS_TO_PUBLISH = 4;

    public const MAX_GALLERY = 12;

    public const MIN_IMAGE_WIDTH = 400;

    public const MIN_IMAGE_HEIGHT = 300;

    private const PERU_LAT_MIN = -18.6;

    private const PERU_LAT_MAX = 0.2;

    private const PERU_LNG_MIN = -81.5;

    private const PERU_LNG_MAX = -68.5;

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

        $image = [
            'image',
            'mimes:jpeg,jpg,png,webp',
            'max:5120',
            'dimensions:min_width='.self::MIN_IMAGE_WIDTH.',min_height='.self::MIN_IMAGE_HEIGHT,
        ];

        return [
            'nombre' => ['required', 'string', 'min:3', 'max:150', 'regex:/\p{L}/u'],
            'slug' => ['nullable', 'alpha_dash', 'max:160', Rule::unique('hotels', 'slug')->ignore($hotelId)],
            'ruc' => ['required', 'string', new PeruRuc],
            'resumen' => ['nullable', 'string', 'min:10', 'max:300'],
            'descripcion' => ['nullable', 'string', 'max:10000'],
            'direccion' => ['required', 'string', 'min:5', 'max:255', 'regex:/\p{L}/u'],
            'referencia' => ['nullable', 'string', 'min:3', 'max:255'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'provincia_id' => ['nullable', 'integer', 'exists:provincias,id'],
            'distrito_id' => ['nullable', 'integer', 'exists:distritos,id'],
            'latitud' => ['nullable', 'required_with:longitud', 'numeric', 'between:'.self::PERU_LAT_MIN.','.self::PERU_LAT_MAX],
            'longitud' => ['nullable', 'required_with:latitud', 'numeric', 'between:'.self::PERU_LNG_MIN.','.self::PERU_LNG_MAX],
            'telefono_reservas' => ['required', 'string', new PeruMobilePhone],
            'email' => ['nullable', 'string', 'email:rfc,strict', 'max:150'],
            'website' => ['nullable', 'string', 'max:200', 'url:http,https', 'regex:#^https?://[^/\s.]+(\.[^/\s.]+)*\.[a-z]{2,}(/|$|\?|:)#i'],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],

            'tipos_habitacion' => ['required', 'array', 'min:1'],
            'tipos_habitacion.*' => ['distinct', Rule::in(Hotel::TIPOS_HABITACION)],
            'precio_desde' => ['nullable', 'required_with:precio_hasta', 'numeric', 'decimal:0,2', 'min:1', 'max:99999.99'],
            'precio_hasta' => ['nullable', 'required_with:precio_desde', 'numeric', 'decimal:0,2', 'min:1', 'max:99999.99'],
            'moneda' => ['nullable', Rule::in(['PEN', 'USD'])],
            'clasificacion' => ['required', Rule::in(Hotel::CLASIFICACIONES)],

            'servicios' => ['required', 'array', 'min:1'],
            'servicios.*' => ['distinct', Rule::in(Hotel::SERVICIOS)],
            'medios_pago' => ['required', 'array', 'min:1'],
            'medios_pago.*' => ['distinct', Rule::in(Hotel::MEDIOS_PAGO)],

            'cover' => ['nullable', ...$image],
            'remove_cover' => ['boolean'],
            'gallery' => ['nullable', 'array', 'max:'.self::MAX_GALLERY],
            'gallery.*' => $image,
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['uuid'],

            'sistema_reservas' => ['required', Rule::in(Hotel::SISTEMAS_RESERVA)],
            'interes_whatsapp' => ['required', Rule::in(Hotel::INTERES_WHATSAPP)],
            'redes_sociales' => ['required', 'array', 'min:1'],
            'redes_sociales.*' => ['distinct', Rule::in(Hotel::REDES_SOCIALES)],
            'herramientas_interes' => ['nullable', 'array'],
            'herramientas_interes.*' => ['distinct', Rule::in(Hotel::HERRAMIENTAS)],
            'mayor_reto' => ['nullable', 'string', 'max:3000'],
            'sugerencias' => ['nullable', 'string', 'max:3000'],

            'destacado' => ['boolean'],
            'estado' => ['required', Rule::in(Hotel::ESTADOS)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.regex' => __('messages.hotels.v_nombre_letters'),
            'direccion.regex' => __('messages.hotels.v_direccion_letters'),
            'latitud.between' => __('messages.hotels.v_coords_peru'),
            'longitud.between' => __('messages.hotels.v_coords_peru'),
            'email.email' => __('messages.hotels.v_email'),
            'website.url' => __('messages.hotels.v_website'),
            'website.regex' => __('messages.hotels.v_website'),
            'check_in.date_format' => __('messages.hotels.v_time'),
            'check_out.date_format' => __('messages.hotels.v_time'),
            'precio_desde.decimal' => __('messages.hotels.v_price_decimals'),
            'precio_hasta.decimal' => __('messages.hotels.v_price_decimals'),
            'cover.dimensions' => __('messages.hotels.v_image_size', ['w' => self::MIN_IMAGE_WIDTH, 'h' => self::MIN_IMAGE_HEIGHT]),
            'gallery.*.dimensions' => __('messages.hotels.v_image_size', ['w' => self::MIN_IMAGE_WIDTH, 'h' => self::MIN_IMAGE_HEIGHT]),
            'gallery.*.image' => __('messages.hotels.v_image_type'),
            'gallery.*.mimes' => __('messages.hotels.v_image_type'),
            'gallery.*.max' => __('messages.hotels.v_image_weight'),
            'cover.max' => __('messages.hotels.v_image_weight'),
            'tipos_habitacion.required' => __('messages.hotels.v_pick_one'),
            'servicios.required' => __('messages.hotels.v_pick_one'),
            'medios_pago.required' => __('messages.hotels.v_pick_one'),
            'redes_sociales.required' => __('messages.hotels.v_pick_one'),
            'clasificacion.required' => __('messages.hotels.v_pick_one'),
            'sistema_reservas.required' => __('messages.hotels.v_pick_one'),
            'interes_whatsapp.required' => __('messages.hotels.v_pick_one'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return collect(trans('messages.hotels.attributes'))
            ->filter(fn ($label) => is_string($label))
            ->all();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $errors = $validator->errors();

            $desde = $this->input('precio_desde');
            $hasta = $this->input('precio_hasta');
            if (is_numeric($desde) && is_numeric($hasta) && (float) $hasta < (float) $desde) {
                $errors->add('precio_hasta', __('messages.hotels.price_range_invalid'));
            }

            $checkIn = $this->input('check_in');
            $checkOut = $this->input('check_out');
            if (! $errors->has('check_in') && ! $errors->has('check_out')
                && $checkIn !== null && $checkIn === $checkOut) {
                $errors->add('check_out', __('messages.hotels.v_checkout_same'));
            }

            $redes = (array) $this->input('redes_sociales', []);
            if (in_array('ninguna', $redes, true) && count($redes) > 1) {
                $errors->add('redes_sociales', __('messages.hotels.v_redes_ninguna'));
            }

            $this->validateGeoHierarchy($validator);

            if (! $errors->has('ruc') && ! $errors->has('nombre')) {
                $duplicate = Hotel::query()
                    ->where('ruc', $this->input('ruc'))
                    ->whereRaw('LOWER(nombre) = ?', [Str::lower((string) $this->input('nombre'))])
                    ->when($this->route('hotel'), fn ($q, Hotel $hotel) => $q->whereKeyNot($hotel->id))
                    ->exists();

                if ($duplicate) {
                    $errors->add('nombre', __('messages.hotels.v_duplicate'));
                }
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

        $email = $this->cleanText('email');
        $website = $this->cleanText('website');
        if ($website !== null && ! preg_match('#^https?://#i', $website)) {
            $website = 'https://'.$website;
        }

        $this->merge([
            ...$lists,
            'nombre' => $this->cleanText('nombre'),
            'direccion' => $this->cleanText('direccion'),
            'referencia' => $this->cleanText('referencia'),
            'resumen' => $this->cleanText('resumen'),
            'ruc' => preg_replace('/[\s\-.]/', '', (string) $this->input('ruc', '')),
            'telefono_reservas' => PeruMobilePhone::normalize($this->input('telefono_reservas')),
            'email' => $email !== null ? Str::lower($email) : null,
            'website' => $website,
            'moneda' => filled($this->input('moneda')) ? Str::upper((string) $this->input('moneda')) : 'PEN',
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

    private function validateGeoHierarchy(Validator $validator): void
    {
        $errors = $validator->errors();
        if ($errors->hasAny(['departamento_id', 'provincia_id', 'distrito_id'])) {
            return;
        }

        $departamentoId = $this->input('departamento_id');
        $provinciaId = $this->input('provincia_id');
        $distritoId = $this->input('distrito_id');

        if ($distritoId !== null && $provinciaId === null) {
            $errors->add('provincia_id', __('messages.hotels.v_geo_incomplete'));

            return;
        }

        if ($provinciaId !== null && $departamentoId === null) {
            $errors->add('departamento_id', __('messages.hotels.v_geo_incomplete'));

            return;
        }

        if ($provinciaId !== null) {
            $provincia = Provincia::query()->find($provinciaId);
            if ($provincia === null || (int) $provincia->departamento_id !== (int) $departamentoId) {
                $errors->add('provincia_id', __('messages.hotels.v_geo_mismatch'));

                return;
            }
        }

        if ($distritoId !== null) {
            $distrito = Distrito::query()->find($distritoId);
            if ($distrito === null || (int) $distrito->provincia_id !== (int) $provinciaId) {
                $errors->add('distrito_id', __('messages.hotels.v_geo_mismatch'));
            }
        }
    }

    /** Recorta y colapsa espacios; devuelve null si queda vacío. */
    private function cleanText(string $key): ?string
    {
        $value = $this->input($key);
        if (! is_string($value)) {
            return null;
        }

        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        return $value === '' ? null : $value;
    }

    private function blankToNull(string $key): mixed
    {
        $value = $this->input($key);

        return $value === '' || $value === null ? null : $value;
    }
}
