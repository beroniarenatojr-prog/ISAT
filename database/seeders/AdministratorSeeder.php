<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * The Administrator: a dual-role super-admin + teacher account (see
 * User::isAdministrator()). division.position_title is "Administrator" so
 * roleLabel() shows that instead of "Principal"; this is the only account
 * allowed to create other Principal (super-admin) accounts.
 *
 * This dual role isn't something self-registration can produce (registration
 * only ever assigns the plain "teacher" role), so it stays seeded here rather
 * than in PersonnelSeeder/TeacherSeeder. Existing passwords are never
 * overwritten.
 */
class AdministratorSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'teacher']);

        $email = 'prince.ariel.r.alvaro@deped.gov.ph';

        $user = User::firstOrNew(['email' => $email]);
        if (! $user->exists) {
            $user->password = Hash::make('password');
        }

        $user->name = 'Prince Ariel R. Alvaro';
        $user->career_stage = 'Beginning Towards Proficient';
        $user->is_active = true;
        $user->division = json_encode([
            'position_title' => 'Administrator',
            'position_range' => 'T1 - T3',
            'career_stage' => 'Beginning Towards Proficient',
            'level' => null,
            'department' => null,
        ]);
        $user->save();
        $user->syncRoles(['teacher', 'super-admin']);

        $this->command->info('AdministratorSeeder: Administrator account ready.');
    }
}
