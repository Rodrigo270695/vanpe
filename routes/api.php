<?php

use App\Http\Controllers\Api\Tourist\AuthController;
use App\Http\Controllers\Api\Tourist\PasswordResetController;
use App\Http\Controllers\Api\Tourist\ProfileController;
use App\Http\Controllers\Api\Tourist\RestaurantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API turista legacy (compatibilidad)
|--------------------------------------------------------------------------
*/
Route::prefix('tourist')->group(function () {
    Route::get('restaurants', [RestaurantController::class, 'index']);
    Route::get('restaurants/{slug}', [RestaurantController::class, 'show']);
    Route::get('restaurants/{slug}/slots', [RestaurantController::class, 'slots']);
});

/*
|--------------------------------------------------------------------------
| API turista v1 — autenticación + perfil (Sanctum)
|--------------------------------------------------------------------------
*/
Route::prefix('v1/tourist')->group(function () {
    Route::middleware('throttle:tourist-auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('google', [AuthController::class, 'google']);
        Route::post('forgot-password', [PasswordResetController::class, 'forgot']);
        Route::post('reset-password', [PasswordResetController::class, 'reset']);
    });

    Route::middleware(['auth:sanctum', 'ability:tourist-app', 'throttle:tourist-api'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::patch('profile', [ProfileController::class, 'update']);
        Route::put('password', [ProfileController::class, 'changePassword']);
        Route::delete('account', [ProfileController::class, 'destroy']);
    });

    // Catálogo también bajo v1 (mismo controlador).
    Route::get('restaurants', [RestaurantController::class, 'index']);
    Route::get('restaurants/{slug}', [RestaurantController::class, 'show']);
    Route::get('restaurants/{slug}/slots', [RestaurantController::class, 'slots']);
});
