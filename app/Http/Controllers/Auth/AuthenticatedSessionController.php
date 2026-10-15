<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'canRegister' => Route::has('register'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Redirect based on user role
        $user = Auth::user();
        
        if ($user->hasAnyRole(['admin', 'super-admin'])) {
            return redirect()->intended(route('admin.dashboard'));
        }
        
        if ($user->hasRole('teacher')) {
            return redirect()->intended(route('teacher.dashboard'));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     *
     * Uses Inertia::location() so the client does a FULL page load to /login
     * (not an SPA visit). That drops the cached panel pages from Inertia's
     * history state, so pressing Back after logout re-requests from the server
     * and lands on /login - the user must sign in again.
     */
    public function destroy(Request $request): HttpResponse
    {
        Auth::guard('web')->logout();

        // Throw away the key that Inertia's encrypted history state was sealed
        // with (config/inertia.php -> history.encrypt). Every page still sitting
        // in the browser's history becomes undecryptable, so pressing Back has
        // to re-request from the server instead of re-rendering a cached panel.
        Inertia::clearHistory();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location(route('login'));
    }
}
