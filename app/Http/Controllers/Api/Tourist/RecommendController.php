<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tourist\RecommendRequest;
use App\Services\Tourist\HybridRecommendationService;
use Illuminate\Http\JsonResponse;

class RecommendController extends Controller
{
    public function __construct(
        private readonly HybridRecommendationService $recommendations,
    ) {}

    public function __invoke(RecommendRequest $request): JsonResponse
    {
        $result = $this->recommendations->recommend(
            (string) $request->validated('query'),
            (int) $request->integer('limit', 6),
        );

        return response()->json([
            'data' => $result,
        ]);
    }
}
