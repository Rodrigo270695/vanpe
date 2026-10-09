<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\CraftRequest;
use App\Models\Craft;
use App\Services\Platform\CraftWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Artesanía y talentos (solo plataforma). */
class CraftController extends Controller
{
    public function __construct(
        private readonly CraftWriter $writer,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('crafts.view'), 403);

        $crafts = Craft::query()
            ->with(['media', 'tenant:id,slug,nombre_comercial'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Craft $craft): array => $craft->toAdminArray());

        return Inertia::render('crafts/index', [
            'crafts' => $crafts,
            'options' => self::formOptions(),
            'limits' => self::formLimits(),
            'mapbox_token' => config('services.mapbox.token'),
            'can' => [
                'create' => $request->user()?->can('crafts.create'),
                'update' => $request->user()?->can('crafts.update'),
                'delete' => $request->user()?->can('crafts.delete'),
                'publish' => $request->user()?->can('crafts.publish'),
            ],
        ]);
    }

    public function store(CraftRequest $request): RedirectResponse
    {
        if ($request->input('estado') === Craft::ESTADO_PUBLICADO) {
            abort_unless((bool) $request->user()?->can('crafts.publish'), 403);
        }

        $this->writer->create($request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.crafts.created'));
    }

    public function update(CraftRequest $request, Craft $craft): RedirectResponse
    {
        if ($request->input('estado') === Craft::ESTADO_PUBLICADO
            && $craft->estado !== Craft::ESTADO_PUBLICADO) {
            abort_unless((bool) $request->user()?->can('crafts.publish'), 403);
        }

        $this->writer->update($craft, $request->validated(), $request->user()?->id);

        return back()->with('success', __('messages.crafts.updated'));
    }

    public function destroy(Request $request, Craft $craft): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('crafts.delete'), 403);

        $craft->delete();

        return back()->with('success', __('messages.crafts.deleted'));
    }

    /**
     * @return array<string, list<string>>
     */
    public static function formOptions(): array
    {
        return [
            'estados' => Craft::ESTADOS,
            'redes_sociales' => Craft::REDES_SOCIALES,
            'redes_default' => Craft::REDES_DEFAULT,
        ];
    }

    /**
     * @return array<string, int|float>
     */
    public static function formLimits(): array
    {
        return [
            'max_photos' => CraftRequest::MAX_PHOTOS,
            'min_photos_to_publish' => CraftRequest::MIN_PHOTOS_TO_PUBLISH,
            'max_price' => CraftRequest::MAX_PRICE,
        ];
    }
}
