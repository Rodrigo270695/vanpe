<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Idiomas soportados por la aplicación.
     *
     * @var array<int, string>
     */
    public const SUPPORTED = ['es', 'en'];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale');

        if (! in_array($locale, self::SUPPORTED, true)) {
            $locale = config('app.locale');
        }

        if (! in_array($locale, self::SUPPORTED, true)) {
            $locale = 'es';
        }

        App::setLocale($locale);

        return $next($request);
    }
}
