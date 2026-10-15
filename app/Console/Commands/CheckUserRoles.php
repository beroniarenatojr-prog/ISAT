<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CheckUserRoles extends Command
{
    protected $signature = 'user:check-roles';
    protected $description = 'Check all users and their roles';

    public function handle()
    {
        $this->info('Users and their roles:');
        $this->newLine();

        $users = User::with('roles')->get();

        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->implode(', ') ?: 'No roles';
            $this->line("{$user->email} - Roles: {$roles}");
        }

        return Command::SUCCESS;
    }
}
