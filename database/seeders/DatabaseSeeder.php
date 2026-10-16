<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Positions (RPMS career-stage tiers)
        $this->call(PositionSeeder::class);

        // Roles
        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'teacher']);

        // IPCRF KRAs. Objectives + ratings are managed in the admin UI, not seeded.
        $this->call(KraSeeder::class);

        // IPCRF KRAs + objectives (PPST .2 Proficient + .3 Highly Proficient).
        $this->call(IpcrfObjectiveSeeder::class);

        // Staff accounts (Principal, Master Teachers) are no longer seeded -
        // the Administrator creates them in User Management, and teachers
        // register themselves via /register for an admin to approve.

        // The Administrator: dual-role super-admin + teacher account.
        $this->call(AdministratorSeeder::class);

        // SHS "Performance Rating & Challenges Encountered" questionnaire template.
        $this->call(ShsQuestionnaireSeeder::class);

        // "Ready for Self-Assessment" e-TRACES satisfaction survey template.
        $this->call(EtracesSurveySeeder::class);

        // Dummy accounts (one per account type, @demo.local, password "password").
        $this->call(DemoAccountSeeder::class);
    }
}
