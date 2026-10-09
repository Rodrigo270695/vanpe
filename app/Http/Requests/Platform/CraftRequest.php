<?php

namespace App\Http\Requests\Platform;

use App\Models\Craft;
use App\Rules\PeruMobilePhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CraftRequest extends FormRequest
{
    public const MAX_PHOTOS = 12;

    public const MIN_PHOTOS_TO_PUBLISH = 1;

    public const MIN_IMAGE_WIDTH = 300;

    public const MIN_IMAGE_HEIGHT = 300;

    public const MAX_PRICE = 99999.99;

    private const PERU_LAT_MIN = -18.6;

    private const PERU_LAT_MAX = 0.2;

    private const PERU_LNG_MIN = -81.5;

    private const PERU_LNG_MAX = -68.5;

    /** Dominios aceptados por red social (la web propia acepta cualquiera). */
    private const RED_DOMAINS = [
        'facebook' => ['facebook.com', 'fb.com', 'fb.me'],
        'instagram' => ['instagram.com', 'instagr.am'],
        'tiktok' => ['tiktok.com'],
        'youtube' => ['youtube.com', 'youtu.be'],
    ];

    /** Base para convertir un "@usuario" en URL. */
    private const RED_HANDLE_BASE = [
        'facebook' => 'https://www.facebook.com/',
        'instagram' => 'https://www.instagram.com/',
        'tiktok' => 'https://www.tiktok.com/@',
        'youtube' => 'https://www.youtube.com/@',
    ];

    public function authorize(): bool
    {
        return (bool) $this->user()?->can(
            $this->currentCraft() === null ? 'crafts.create' : 'crafts.update',
        );
    }

    /** Ficha que se está editando (null al crear). */
    protected function currentCraft(): ?Craft
    {
        $craft = $this->route('craft');

        return $craft instanceof Craft ? $craft : null;
    }

    /**
     * Si es false, la descripción pasa a opcional (borrador del dueño);
     * el formato se valida igual cuando viene llena.
     */
    protected function requiresFullProfile(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $craftId = $this->currentCraft()?->id;

        return [
            'nombre' => ['required', 'string', 'min:3', 'max:150', 'regex:/\p{L}/u'],
            'slug' => ['nullable', 'alpha_dash', 'max:160', Rule::unique('crafts', 'slug')->ignore($craftId)],
            'descripcion' => [$this->requiresFullProfile() ? 'required' : 'nullable', 'string', 'min:10', 'max:5000'],
            'latitud' => ['nullable', 'required_with:longitud', 'numeric', 'between:'.self::PERU_LAT_MIN.','.self::PERU_LAT_MAX],
            'longitud' => ['nullable', 'required_with:latitud', 'numeric', 'between:'.self::PERU_LNG_MIN.','.self::PERU_LNG_MAX],
            'telefono_contacto' => ['nullable', 'string', new PeruMobilePhone],

            'redes_sociales' => ['nullable', 'array', 'max:'.count(Craft::REDES_SOCIALES)],
            'redes_sociales.*.red' => ['required', 'distinct', Rule::in(Craft::REDES_SOCIALES)],
            'redes_sociales.*.url' => ['required', 'string', 'max:300', 'url:http,https'],

            'photos' => ['nullable', 'array', 'max:'.self::MAX_PHOTOS],
            'photos.*.id' => ['nullable', 'uuid'],
            'photos.*.file' => [
                'nullable',
                'required_without:photos.*.id',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
                'dimensions:min_width='.self::MIN_IMAGE_WIDTH.',min_height='.self::MIN_IMAGE_HEIGHT,
            ],
            'photos.*.titulo' => ['nullable', 'string', 'max:150'],
            'photos.*.precio' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:'.self::MAX_PRICE],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['uuid'],

            'destacado' => ['boolean'],
            'estado' => ['required', Rule::in(Craft::ESTADOS)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $imageSize = __('messages.crafts.v_image_size', ['w' => self::MIN_IMAGE_WIDTH, 'h' => self::MIN_IMAGE_HEIGHT]);

        return [
            'nombre.regex' => __('messages.crafts.v_nombre_letters'),
            'latitud.between' => __('messages.crafts.v_coords_peru'),
            'longitud.between' => __('messages.crafts.v_coords_peru'),
            'redes_sociales.*.url.url' => __('messages.crafts.v_red_url'),
            'redes_sociales.*.red.distinct' => __('messages.crafts.v_red_duplicate'),
            'photos.max' => __('messages.crafts.v_photos_max', ['max' => self::MAX_PHOTOS]),
            'photos.*.file.required_without' => __('messages.crafts.v_photo_required'),
            'photos.*.file.image' => __('messages.crafts.v_image_type'),
            'photos.*.file.mimes' => __('messages.crafts.v_image_type'),
            'photos.*.file.max' => __('messages.crafts.v_image_weight'),
            'photos.*.file.dimensions' => $imageSize,
            'photos.*.precio.numeric' => __('messages.crafts.v_price_number'),
            'photos.*.precio.decimal' => __('messages.crafts.v_price_decimals'),
            'photos.*.precio.min' => __('messages.crafts.v_price_number'),
            'photos.*.precio.max' => __('messages.crafts.v_price_max'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return collect(trans('messages.crafts.attributes'))
            ->filter(fn ($label) => is_string($label))
            ->all();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $errors = $validator->errors();
            $craft = $this->currentCraft();

            foreach ((array) $this->input('redes_sociales', []) as $i => $row) {
                $red = is_array($row) ? (string) ($row['red'] ?? '') : '';
                $url = is_array($row) ? (string) ($row['url'] ?? '') : '';
                if ($errors->has("redes_sociales.{$i}.url") || ! isset(self::RED_DOMAINS[$red])) {
                    continue;
                }
                if (! $this->hostMatches($url, self::RED_DOMAINS[$red])) {
                    $errors->add("redes_sociales.{$i}.url", __('messages.crafts.v_red_domain', [
                        'red' => __("messages.crafts.red_{$red}"),
                    ]));
                }
            }

            $removed = array_map('strval', (array) $this->input('remove_media_ids', []));
            $ownIds = $craft !== null
                ? $craft->media()->pluck('id')->map(fn ($id) => (string) $id)->all()
                : [];

            $photoCount = 0;
            foreach ((array) $this->input('photos', []) as $i => $row) {
                $id = is_array($row) ? (string) ($row['id'] ?? '') : '';
                if ($id !== '') {
                    if (! in_array($id, $ownIds, true)) {
                        $errors->add("photos.{$i}.id", __('messages.crafts.v_photo_unknown'));
                    } elseif (! in_array($id, $removed, true)) {
                        $photoCount++;
                    }

                    continue;
                }
                if ($this->hasFile("photos.{$i}.file")) {
                    $photoCount++;
                }
            }

            if ($this->input('estado') === Craft::ESTADO_PUBLICADO
                && $photoCount < self::MIN_PHOTOS_TO_PUBLISH) {
                $errors->add('photos', __('messages.crafts.publish_photos_required', [
                    'min' => self::MIN_PHOTOS_TO_PUBLISH,
                ]));
            }
        });
    }

    /**
     * @param  list<string>  $domains
     */
    private function hostMatches(string $url, array $domains): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        foreach ($domains as $domain) {
            if ($host === $domain || str_ends_with($host, '.'.$domain)) {
                return true;
            }
        }

        return false;
    }

    protected function prepareForValidation(): void
    {
        $redes = [];
        foreach ((array) $this->input('redes_sociales', []) as $row) {
            if (! is_array($row)) {
                continue;
            }
            $red = (string) ($row['red'] ?? '');
            $url = $this->normalizeRedUrl($red, (string) ($row['url'] ?? ''));
            if ($url === null) {
                continue;
            }
            $redes[] = ['red' => $red, 'url' => $url];
        }

        $photos = [];
        foreach ((array) $this->input('photos', []) as $i => $row) {
            $row = is_array($row) ? $row : [];
            $precio = trim(str_replace(',', '.', (string) ($row['precio'] ?? '')));
            $titulo = $this->clean($row['titulo'] ?? null);
            $photos[$i] = [
                'id' => filled($row['id'] ?? null) ? (string) $row['id'] : null,
                'titulo' => $titulo,
                'precio' => $precio === '' ? null : $precio,
            ];
        }

        $removed = $this->input('remove_media_ids', []);
        if (is_string($removed)) {
            $removed = explode(',', $removed);
        }

        $this->merge([
            'nombre' => $this->clean($this->input('nombre')),
            'descripcion' => $this->cleanMultiline($this->input('descripcion')),
            'slug' => filled($this->input('slug')) ? Str::slug((string) $this->input('slug')) : null,
            'telefono_contacto' => PeruMobilePhone::normalize($this->input('telefono_contacto')) ?: null,
            'latitud' => $this->blankToNull('latitud'),
            'longitud' => $this->blankToNull('longitud'),
            'redes_sociales' => $redes,
            'photos' => $photos,
            'remove_media_ids' => array_values(array_filter((array) $removed, fn ($v) => $v !== null && $v !== '')),
            'destacado' => $this->boolean('destacado'),
        ]);
    }

    /** "@usuario" → URL de la red; sin esquema → https://. Devuelve null si viene vacío. */
    private function normalizeRedUrl(string $red, string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, '@') && isset(self::RED_HANDLE_BASE[$red])) {
            return self::RED_HANDLE_BASE[$red].ltrim(substr($value, 1), '@');
        }

        if (! preg_match('#^https?://#i', $value)) {
            return 'https://'.$value;
        }

        return $value;
    }

    /** Recorta y colapsa espacios; devuelve null si queda vacío. */
    private function clean(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        return $value === '' ? null : $value;
    }

    private function cleanMultiline(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function blankToNull(string $key): mixed
    {
        $value = $this->input($key);

        return $value === '' || $value === null ? null : $value;
    }
}
