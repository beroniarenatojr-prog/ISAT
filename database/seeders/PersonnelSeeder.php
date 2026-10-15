<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * ISAT Ilagan Campus administrative roster (Principal, Head Teachers).
 *
 * Plain Teacher I-III accounts are no longer seeded here - teachers create
 * their own accounts via the /register page and an admin approves them in
 * Teacher Management. Master Teachers are seeded separately by
 * MasterTeacherSeeder (admin + teacher) since that dual role isn't something
 * self-registration can produce.
 *
 * Each row: [name, position, gender, status?, school?]
 *   status defaults to "Permanent", school to "ISAT-MAIN", level is "JHS".
 *
 * Accounts are matched by generated email; existing passwords are never
 * overwritten. run() removes seeded @deped.gov.ph accounts no longer on the
 * roster, but never touches anyone holding the admin or teacher role - those
 * are MasterTeacherSeeder's / self-registration's territory.
 */
class PersonnelSeeder extends Seeder
{
    private const LEVEL = 'JHS';

    /** name => email override */
    private array $emailOverrides = [
        'Mary Ann Lopez Catindig' => 'principal@deped.gov.ph',
    ];

    private array $administrative = [
        ['CATINDIG, MARY ANN LOPEZ', 'Principal IV', 'Female'],
        ['BUGARIN, ROMEO AGBUYA', 'Head Teacher III', 'Male'],
        ['CLARAVALL, STEPHALYN FENOL', 'Head Teacher III', 'Female'],
        ['DIEGO, JOHN MOLINA', 'Head Teacher IV', 'Male'],
        ['NICASIO, NORMAN TAROBAL', 'Head Teacher VI', 'Male'],
    ];

    public function run(): void
    {
        foreach (['super-admin', 'admin', 'teacher'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $keepEmails = [];
        $usedEmails = [];
        $counts = ['super-admin' => 0];

        $groups = [
            'super-admin' => $this->administrative,
        ];

        foreach ($groups as $role => $rows) {
            foreach ($rows as $row) {
                $name = $row[0];
                $position = $row[1];
                $gender = $row[2];
                $status = $row[3] ?? 'Permanent';
                $school = $row[4] ?? 'ISAT-MAIN';
                $level = $row[5] ?? self::LEVEL;

                $fullName = $this->humanName($name);
                $email = $this->emailOverrides[$fullName]
                    ?? $this->uniqueEmail(Str::slug($fullName, '.'), $usedEmails);
                $keepEmails[] = $email;

                [$range, $careerStage] = $this->tierFor($position);

                $user = User::firstOrNew(['email' => $email]);
                if (! $user->exists) {
                    $user->password = Hash::make('password');
                }
                $user->name = $fullName;
                $user->gender = $gender;
                $user->career_stage = $careerStage;
                $user->teacher_status = $status;
                $user->teacher_type = $status;
                $user->school_campus = $school;
                $user->level = $level;
                $user->is_active = true;
                $user->division = json_encode([
                    'position_title' => $position,
                    'position_range' => $range,
                    'career_stage' => $careerStage,
                    'level' => $level,
                    'department' => null,
                ]);
                $user->save();
                $user->syncRoles([$role]);

                $counts[$role]++;
            }
        }

        // Drop seeded @deped.gov.ph accounts that fell off the administrative
        // roster (renamed people, removed staff). Never touch admin or teacher
        // accounts - those belong to MasterTeacherSeeder or to a teacher who
        // registered themselves, and must never be deleted by this cleanup.
        $stale = User::where('email', 'like', '%@deped.gov.ph')
            ->whereNotIn('email', $keepEmails)
            ->whereDoesntHave('roles', fn ($q) => $q->whereIn('name', ['admin', 'teacher']))
            ->get();

        foreach ($stale as $user) {
            $user->syncRoles([]);
            $user->delete();
        }

        $this->command->info(sprintf(
            'PersonnelSeeder: %d super-admins. Removed %d stale account(s).',
            $counts['super-admin'],
            $stale->count(),
        ));
    }

    /** Guarantee a unique @deped.gov.ph address within this run. */
    private function uniqueEmail(string $slug, array &$used): string
    {
        $email = "{$slug}@deped.gov.ph";
        $n = 2;
        while (isset($used[$email])) {
            $email = "{$slug}{$n}@deped.gov.ph";
            $n++;
        }
        $used[$email] = true;

        return $email;
    }

    /** [position_range|null, career_stage] from an exact position title. */
    private function tierFor(string $position): array
    {
        if (str_starts_with($position, 'Master Teacher')) {
            return ['MT1 - MT2', 'Highly Proficient'];
        }
        if (str_starts_with($position, 'Head Teacher') || str_starts_with($position, 'Principal')) {
            return [null, 'Distinguished'];
        }

        // Teacher I-III and "Not Indicated"
        return ['T1 - T3', 'Beginning Towards Proficient'];
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
