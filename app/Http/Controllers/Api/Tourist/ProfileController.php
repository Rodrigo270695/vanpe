<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tourist\ChangeCustomerPasswordRequest;
use App\Http\Requests\Tourist\UpdateCustomerProfileRequest;
use App\Http\Resources\Tourist\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $customer->fill($request->validated());
        $customer->save();

        return response()->json([
            'message' => 'Perfil actualizado.',
            'data' => new CustomerResource($customer->fresh()),
        ]);
    }

    public function changePassword(ChangeCustomerPasswordRequest $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $customer->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        // Revocar otros tokens; mantener el actual.
        $currentId = $customer->currentAccessToken()?->id;
        $customer->tokens()
            ->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))
            ->delete();

        return response()->json([
            'message' => 'Contraseña actualizada.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $request->validate([
            'confirmation' => ['required', 'in:ELIMINAR'],
        ]);

        $customer->tokens()->delete();
        $customer->delete();

        return response()->json([
            'message' => 'Cuenta eliminada.',
        ]);
    }
}
