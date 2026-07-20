<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PromoCodeRequest;
use App\Models\PromoCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Códigos promocionales (solo plataforma / superadmin). */
class PromoCodeController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('promo_codes.view'), 403);

        $promoCodes = PromoCode::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PromoCode $row): array => [
                'id' => $row->id,
                'code' => $row->code,
                'description' => $row->description,
                'type' => $row->type,
                'value' => $row->value,
                'max_uses' => $row->max_uses,
                'uses' => $row->uses,
                'valid_from' => $row->valid_from?->toDateString(),
                'valid_until' => $row->valid_until?->toDateString(),
                'active' => $row->active,
                'is_valid' => $row->isCurrentlyValid(),
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        return Inertia::render('promo-codes/index', [
            'promoCodes' => $promoCodes,
            'types' => PromoCode::TYPES,
            'can' => [
                'create' => $request->user()?->can('promo_codes.create'),
                'update' => $request->user()?->can('promo_codes.update'),
                'delete' => $request->user()?->can('promo_codes.delete'),
            ],
        ]);
    }

    public function store(PromoCodeRequest $request): RedirectResponse
    {
        PromoCode::query()->create($request->validated());

        return back()->with('success', __('messages.promo_codes.created'));
    }

    public function update(PromoCodeRequest $request, PromoCode $promoCode): RedirectResponse
    {
        $promoCode->update($request->validated());

        return back()->with('success', __('messages.promo_codes.updated'));
    }

    public function destroy(Request $request, PromoCode $promoCode): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('promo_codes.delete'), 403);

        $promoCode->delete();

        return back()->with('success', __('messages.promo_codes.deleted'));
    }
}
