<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to the Administrator - the dual-role super-admin + teacher
 * account whose position is not the principalship (see User::isAdministrator()).
 */
class AdministratorMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check() || ! auth()->user()->isAdministrator()) {
            abort(403, 'Unauthorized access. Administrator role required.');
        }

        return $next($request);
    }
}
