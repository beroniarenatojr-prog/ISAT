<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        // Allow both admin and super-admin roles
        if (!auth()->user()->hasAnyRole(['admin', 'super-admin'])) {
            abort(403, 'Unauthorized access. Admin role required.');
        }

        return $next($request);
    }
}
