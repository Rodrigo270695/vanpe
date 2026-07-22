<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tourist\StoreReviewRequest;
use App\Models\Customer;
use App\Models\CustomerReview;
use App\Services\Tourist\ReviewRatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewRatingService $ratings,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $targetType = (string) $request->string('target_type');
        $targetId = (string) $request->string('target_id');

        abort_unless(
            in_array($targetType, [
                CustomerReview::TARGET_RESTAURANT,
                CustomerReview::TARGET_TOUR_SPOT,
            ], true) && $targetId !== '',
            422,
            'Debes indicar target_type y target_id.',
        );

        $reviews = CustomerReview::query()
            ->with('customer:id,name,avatar_url')
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => $reviews->getCollection()->map(fn (CustomerReview $review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'titulo' => $review->titulo,
                'comentario' => $review->comentario,
                'created_at' => $review->created_at?->toIso8601String(),
                'customer' => [
                    'name' => $review->customer?->name,
                    'avatar_url' => $review->customer?->avatar_url,
                ],
            ])->values(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function store(StoreReviewRequest $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $review = $this->ratings->upsert(
            $customer,
            (string) $request->validated('target_type'),
            (string) $request->validated('target_id'),
            $request->safe()->only(['rating', 'titulo', 'comentario']),
        );

        return response()->json([
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'titulo' => $review->titulo,
                'comentario' => $review->comentario,
                'target_type' => $review->target_type,
                'target_id' => $review->target_id,
                'created_at' => $review->created_at?->toIso8601String(),
            ],
            'message' => 'Valoración guardada.',
        ], 201);
    }
}
