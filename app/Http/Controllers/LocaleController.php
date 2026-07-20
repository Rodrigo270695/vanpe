<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Persiste el idioma elegido por el usuario en una cookie y vuelve a la página actual.
 */
class LocaleController extends Controller
{
    public function update(Request $request, string $locale): RedirectResponse
    {
        if (! in_array($locale, SetLocale::SUPPORTED, true)) {
            abort(422);
        }

        return back()->cookie('locale', $locale, 60 * 24 * 365);
    }
}
