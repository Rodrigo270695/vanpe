<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tourist\ForgotCustomerPasswordRequest;
use App\Http\Requests\Tourist\ResetCustomerPasswordRequest;
use App\Models\Customer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function forgot(ForgotCustomerPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('customers')->sendResetLink([
            'email' => strtolower($request->string('email')->toString()),
        ]);

        // Respuesta uniforme para no filtrar existencia de correo.
        return response()->json([
            'message' => 'Si el correo existe, enviaremos instrucciones para restablecer la contraseña.',
            'status' => $status === Password::RESET_LINK_SENT ? 'sent' : 'accepted',
        ]);
    }

    public function reset(ResetCustomerPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('customers')->reset(
            [
                'email' => strtolower($request->string('email')->toString()),
                'password' => $request->string('password')->toString(),
                'password_confirmation' => $request->string('password_confirmation')->toString(),
                'token' => $request->string('token')->toString(),
            ],
            function (Customer $customer, string $password): void {
                $customer->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $customer->tokens()->delete();

                event(new PasswordReset($customer));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'Contraseña restablecida. Ya puedes iniciar sesión.',
        ]);
    }
}
