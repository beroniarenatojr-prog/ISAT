<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

// Find the user you're logged in as (based on the screenshot showing "admin@gmail.com")
// Let's fix all admin users
$adminEmails = ['admin@gmail.com', 'admin1@gmail.com', 'admin2@gmail.com', 'admin3@gmail.com'];

foreach ($adminEmails as $email) {
    $user = User::where('email', $email)->first();
    
    if ($user) {
        // Assign admin role
        $user->syncRoles(['admin']);
        echo "✅ Admin role assigned to: {$user->name} ({$user->email})\n";
    }
}

// Also fix super admin
$superAdmin = User::where('email', 'superadmin@gmail.com')->first();
if ($superAdmin) {
    $superAdmin->syncRoles(['super-admin']);
    echo "✅ Super-admin role assigned to: {$superAdmin->name} ({$superAdmin->email})\n";
}

echo "\n✅ All admin permissions fixed!\n";

