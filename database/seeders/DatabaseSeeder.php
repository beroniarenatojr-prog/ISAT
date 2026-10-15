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

        // Master Teachers I-V - dual role (admin + teacher): they upload MOVs
        // and the Principal rates them.
        $this->call(MasterTeacherSeeder::class);

        // Administrative roster (Principal, Head Teachers). Plain teacher
        // accounts are no longer seeded - teachers create their own accounts
        // via the /register page and an admin approves them.
        $this->call(PersonnelSeeder::class);

        // The Administrator: dual-role super-admin + teacher account.
        $this->call(AdministratorSeeder::class);

        // SHS "Performance Rating & Challenges Encountered" questionnaire template.
        $this->call(ShsQuestionnaireSeeder::class);

        // "Ready for Self-Assessment" e-TRACES satisfaction survey template.
        $this->call(EtracesSurveySeeder::class);
    }
}
