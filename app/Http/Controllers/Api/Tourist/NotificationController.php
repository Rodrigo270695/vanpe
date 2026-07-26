<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $unreadOnly = $request->boolean('unread');

        $query = CustomerNotification::query()
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->limit(50);

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $rows = $query->get()->map(fn (CustomerNotification $n): array => [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'body' => $n->body,
            'data' => $n->data ?? [],
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ]);

        return response()->json(['data' => $rows]);
    }

    public function markRead(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'ids' => ['nullable', 'array'],
            'ids.*' => ['uuid'],
            'all' => ['nullable', 'boolean'],
        ]);

        $query = CustomerNotification::query()
            ->where('customer_id', $customer->id)
            ->whereNull('read_at');

        if (! ($data['all'] ?? false)) {
            $ids = $data['ids'] ?? [];
            if ($ids === []) {
                return response()->json(['data' => ['marked' => 0]]);
            }
            $query->whereIn('id', $ids);
        }

        $marked = $query->update(['read_at' => now()]);

        return response()->json(['data' => ['marked' => $marked]]);
    }
}
