<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Dummy accounts, one per account type, for trying the system out and for
 * user-manual screenshots. All use @demo.local addresses.
 *
 * Every account signs in with the password "password". Existing passwords are
 * never overwritten.
 */
class DemoAccountSeeder extends Seeder
{
    /** [email, name, roles, position_title, position_range, career_stage, level, gender] */
    private array $accounts = [
        ['demo.teacher@demo.local', 'Juan Dela Cruz (Demo)', ['teacher'], 'Teacher II', 'T1 - T3', 'Beginning Towards Proficient', 'SHS', 'Male'],
        ['demo.masterteacher@demo.local', 'Ana Reyes (Demo)', ['admin', 'teacher'], 'Master Teacher I', 'MT1 - MT2', 'Highly Proficient', 'JHS', 'Female'],
        ['demo.principal@demo.local', 'Jose Garcia (Demo)', ['super-admin'], 'Principal I', null, 'Distinguished', 'JHS', 'Male'],
        ['demo.administrator@demo.local', 'Maria Santos (Demo)', ['super-admin', 'teacher'], 'Administrator', 'T1 - T3', 'Beginning Towards Proficient', null, 'Female'],
    ];

    public function run(): void
    {
        foreach (['super-admin', 'admin', 'teacher'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        foreach ($this->accounts as [$email, $name, $roles, $title, $range, $careerStage, $level, $gender]) {
            $user = User::firstOrNew(['email' => $email]);
            if (! $user->exists) {
                $user->password = Hash::make('password');
            }
            $user->name = $name;
            $user->gender = $gender;
            $user->career_stage = $careerStage;
            $user->teacher_status = 'Permanent';
            $user->teacher_type = 'Permanent';
            $user->school_campus = 'ISAT-MAIN';
            $user->level = $level;
            $user->is_active = true;
            $user->email_verified_at ??= now();
            $user->division = json_encode([
                'position_title' => $title,
                'position_range' => $range,
                'career_stage' => $careerStage,
                'level' => $level,
                'department' => null,
            ]);
            $user->save();
            $user->syncRoles($roles);
        }

        $this->command->info('DemoAccountSeeder: ' . count($this->accounts) . ' demo accounts ready (password: "password").');
    }
}
