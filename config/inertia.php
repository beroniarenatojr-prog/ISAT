<?php

return [

    /*
    |--------------------------------------------------------------------------
    | History Encryption
    |--------------------------------------------------------------------------
    |
    | Inertia keeps each visited page's props in the browser's history state so
    | Back/Forward can restore a page without a round trip. That is exactly what
    | let a logged-out user press Back and still see their panel, fully
    | rendered, from data cached in the browser.
    |
    | With encryption on, that history state is encrypted with a per-session
    | key. AuthenticatedSessionController::destroy() calls Inertia::clearHistory(),
    | which throws the key away - every earlier history entry becomes
    | undecryptable, so Back forces a real request that the `auth` middleware
    | then bounces to /login.
    |
    | Requires a browser with window.crypto.subtle (all current browsers over
    | HTTPS or localhost).
    |
    */

    'history' => [

        'encrypt' => (bool) env('INERTIA_HISTORY_ENCRYPT', true),

    ],

];
