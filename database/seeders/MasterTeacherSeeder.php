<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Master Teacher I-V accounts.
 *
 * A Master Teacher holds BOTH roles:
 *   admin   -> rates Teacher I-III, uses the admin panel
 *   teacher -> uploads their own MOVs, uses the teacher panel
 *
 * Their division.position_range is "MT1 - MT2", so they land in the Principal's
 * (super-admin) rating scope - the Principal rates Master Teachers.
 *
 * Existing passwords are never overwritten. Run after KraSeeder / before or
 * after PersonnelSeeder (PersonnelSeeder's stale-account cleanup ignores
 * anyone holding the admin role).
 */
class MasterTeacherSeeder extends Seeder
{
    /** [name, position, gender, status?, school?, level?] */
    private array $masterTeachers = [
        ['BALA, ESMERALDA DELA CRUZ', 'Master Teacher I', 'Female'],
        ['EUGENIO, JOVITO GASPAR', 'Master Teacher I', 'Male'],
        ['GOLLABA, GLADYS VILLANUEVA', 'Master Teacher I', 'Female'],
        ['LACCAY, JOCELYN NARIO', 'Master Teacher I', 'Female'],
        ['OCAMPO, ANNALYN CUETO', 'Master Teacher I', 'Female'],
        ['PASCUA, ARMANDO LITTAUA', 'Master Teacher I', 'Male'],
        ['PASCUA, REJOICE CAYABA', 'Master Teacher I', 'Female'],
        ['TUMOLVA, EZECLAY PAPA', 'Master Teacher I', 'Female'],
    ];

    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'teacher']);

        $count = 0;

        foreach ($this->masterTeachers as $row) {
            [$name, $position, $gender] = $row;
            $status = $row[3] ?? 'Permanent';
            $school = $row[4] ?? 'ISAT-MAIN';
            $level = $row[5] ?? 'JHS';

            $fullName = $this->humanName($name);
            $email = Str::slug($fullName, '.') . '@deped.gov.ph';

            // MT I-II -> "MT1 - MT2"; MT III-V would be "MT3 - MT5".
            $range = str_contains($position, 'III')
                || str_contains($position, 'IV')
                || str_contains($position, 'V')
                ? 'MT3 - MT5'
                : 'MT1 - MT2';

            $user = User::firstOrNew(['email' => $email]);
            if (! $user->exists) {
                $user->password = Hash::make('password');
            }
            $user->name = $fullName;
            $user->gender = $gender;
            $user->career_stage = 'Highly Proficient';
            $user->teacher_status = $status;
            $user->teacher_type = $status;
            $user->school_campus = $school;
            $user->level = $level;
            $user->is_active = true;
            $user->division = json_encode([
                'position_title' => $position,
                'position_range' => $range,
                'career_stage' => 'Highly Proficient',
                'level' => $level,
                'department' => null,
            ]);
            $user->save();

            // Dual role: admin + teacher.
            $user->syncRoles(['admin', 'teacher']);

            $count++;
        }

        $this->command->info("MasterTeacherSeeder: {$count} Master Teachers (admin + teacher).");
    }

    /** "SURNAME, FIRST MIDDLE" -> "First Middle Surname" (title case, hyphen aware). */
    private function humanName(string $raw): string
    {
        $raw = trim(preg_replace('/\s+/', ' ', $raw));

        if (str_contains($raw, ',')) {
            [$last, $first] = array_map('trim', explode(',', $raw, 2));
        } else {
            $parts = explode(' ', $raw);
            $last = array_pop($parts);
            $first = implode(' ', $parts);
        }

        $first = ucwords(strtolower($first), " -");
        $last = ucwords(strtolower($last), " -");

        return trim("{$first} {$last}");
    }
}
