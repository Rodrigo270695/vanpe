<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Services\Tourist\CustomerPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogOptionsController extends Controller
{
    public function __construct(
        private readonly CustomerPreferenceService $preferences,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $locale = $this->resolveLocale($request);

        return response()->json([
            'data' => $this->preferences->catalogOptions($locale),
            'meta' => [
                'locale' => $locale,
                'types' => CustomerPreferenceService::PREFERENCE_TYPES,
            ],
        ]);
    }

    private function resolveLocale(Request $request): string
    {
        $explicit = strtolower((string) $request->query('locale', ''));
        if (in_array($explicit, ['es', 'en', 'pt'], true)) {
            return $explicit === 'pt' ? 'es' : $explicit;
        }

        $header = strtolower((string) $request->header('Accept-Language', 'es'));
        $code = substr($header, 0, 2);

        return $code === 'en' ? 'en' : 'es';
    }
}
