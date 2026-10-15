<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get the logged-in user from the session
$user = \App\Models\User::where('email', 'admin@gmail.com')->first();

if (!$user) {
    echo "User not found. Please provide the correct email.\n";
    exit;
}

echo "Current user: {$user->email}\n";
echo "Current roles: " . $user->getRoleNames()->implode(', ') . "\n\n";

// Assign admin role if not already assigned
if (!$user->hasRole('admin') && !$user->hasRole('super-admin')) {
    $user->assignRole('admin');
    echo "✅ Admin role assigned successfully!\n";
} else {
    echo "✅ User already has admin access.\n";
}

echo "\nRoles after fix: " . $user->getRoleNames()->implode(', ') . "\n";
