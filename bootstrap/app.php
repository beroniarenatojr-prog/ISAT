<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
            Route::middleware('web')
                ->group(base_path('routes/teacher.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\NoCache::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'super-admin' => \App\Http\Middleware\SuperAdminMiddleware::class,
            'administrator' => \App\Http\Middleware\AdministratorMiddleware::class,
            'teacher' => \App\Http\Middleware\TeacherMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Records deleted in another tab/request would otherwise surface as a raw
        // 404 page inside Inertia's error modal. Send the user back with a flash
        // message so the page reloads with fresh data instead.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->header('X-Inertia')) {
                return null;
            }

            return back(fallback: '/')
                ->with('error', 'That record no longer exists. The page has been refreshed with the latest data.');
        });
    })->create();
