<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tourist\GoogleLoginRequest;
use App\Http\Requests\Tourist\LoginCustomerRequest;
use App\Http\Requests\Tourist\RegisterCustomerRequest;
use App\Http\Resources\Tourist\CustomerResource;
use App\Models\Customer;
use App\Services\Tourist\CustomerAuthService;
use App\Services\Tourist\GoogleIdTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly CustomerAuthService $authService,
        private readonly GoogleIdTokenVerifier $googleVerifier,
    ) {}

    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $customer = Customer::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => strtolower($request->string('email')->toString()),
            'phone' => $request->string('phone')->toString() ?: null,
            'password' => $request->string('password')->toString(),
            'status' => Customer::STATUS_ACTIVE,
            'email_verified_at' => null,
        ]);

        $session = $this->authService->issueToken($customer, 'tourist-app');

        return response()->json([
            'message' => 'Cuenta creada correctamente.',
            'data' => [
                'token' => $session['token'],
                'token_type' => $session['token_type'],
                'customer' => new CustomerResource($session['customer']),
            ],
        ], 201);
    }

    public function login(LoginCustomerRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email')->toString());

        /** @var Customer|null $customer */
        $customer = Customer::query()->where('email', $email)->first();

        if ($customer === null || ! $customer->hasPassword() || ! Hash::check($request->string('password')->toString(), $customer->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales incorrectas.'],
            ]);
        }

        $session = $this->authService->issueToken(
            $customer,
            $request->string('device_name')->toString() ?: null,
        );

        return response()->json([
            'message' => 'Sesión iniciada.',
            'data' => [
                'token' => $session['token'],
                'token_type' => $session['token_type'],
                'customer' => new CustomerResource($session['customer']),
            ],
        ]);
    }

    public function google(GoogleLoginRequest $request): JsonResponse
    {
        $google = $this->googleVerifier->verify($request->string('id_token')->toString());
        $customer = $this->authService->findOrCreateFromGoogle($google);

        $session = $this->authService->issueToken(
            $customer,
            $request->string('device_name')->toString() ?: 'google',
        );

        return response()->json([
            'message' => 'Sesión iniciada con Google.',
            'data' => [
                'token' => $session['token'],
                'token_type' => $session['token_type'],
                'customer' => new CustomerResource($session['customer']),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        return response()->json([
            'data' => new CustomerResource($customer),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();
        $customer->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesión cerrada.',
        ]);
    }
}
