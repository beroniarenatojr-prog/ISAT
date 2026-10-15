<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// About ISAT Routes
Route::get('/vision', function () {
    return Inertia::render('Vision');
})->name('vision');

Route::get('/mission', function () {
    return Inertia::render('Mission');
})->name('mission');

Route::get('/core-values', function () {
    return Inertia::render('CoreValues');
})->name('core-values');

Route::get('/dashboard', function () {
    $user = auth()->user();
    
    if ($user->hasAnyRole(['admin', 'super-admin'])) {
        return redirect()->route('admin.dashboard');
    }
    
    if ($user->hasRole('teacher')) {
        return redirect()->route('teacher.dashboard');
    }
    
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile photo. Served through PHP (not the public/storage symlink, which
    // Hostinger has no way to create and answers with a 403). Any signed-in
    // user may view another user's avatar - it is shown in staff listings.
    Route::get('/users/{user}/avatar', [DocumentController::class, 'avatar'])->name('users.avatar');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');
    Route::post('/profile/photo/delete', [ProfileController::class, 'deletePhoto'])->name('profile.photo.delete');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/system-refresh-9f3k2', function () {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    return '<pre>'.e(\Illuminate\Support\Facades\Artisan::output()).'</pre>';
});

require __DIR__.'/auth.php';
