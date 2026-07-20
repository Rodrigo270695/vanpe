<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Google OAuth Client IDs (app turista)
    |--------------------------------------------------------------------------
    |
    | ID tokens emitidos por Google Sign-In en Android/iOS/Web. Separados de
    | GOOGLE_CLIENT_ID de la plataforma web (owners). Lista CSV en .env.
    |
    */

    'google_client_ids' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('TOURIST_GOOGLE_CLIENT_IDS', '')),
    ))),

    'token_name' => 'tourist-app',

    'token_ability' => 'tourist-app',

];
