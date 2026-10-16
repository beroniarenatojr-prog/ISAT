<?php

namespace Database\Seeders;

use App\Models\IpcrfConfiguration;
use App\Models\IpcrfRating;
use App\Models\KraSelfRating;
use App\Models\Objective;
use App\Models\QuestionnaireTemplate;
use App\Models\ShsQuestionnaireResponse;
use App\Models\SignedIpcrf;
use App\Models\TeacherQuestionnaire;
use App\Models\TeacherSubmission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * A full dummy IPCRF process for testing: one demo teacher parked at every
 * stage, from "just started" to "signed IPCRF approved", plus a Master Teacher
 * waiting for the Principal's rating.
 *
 *   demo.teacher@demo.local     Not started            (left empty - try the flow yourself)
 *   demo.inprogress@demo.local  MOVs half uploaded
 *   demo.forrating@demo.local   All MOVs, self-ratings, surveys in -> waiting for a rating
 *   demo.forreview@demo.local   Rated, signed IPCRF uploaded       -> waiting for review
 *   demo.completed@demo.local   Signed IPCRF approved              -> done
 *   demo.masterteacher@demo.local  All MOVs in                     -> waiting for the Principal
 *
 * Re-running resets the demo process: every @demo.local account's IPCRF data
 * and uploaded files are wiped and rebuilt. Real accounts are never touched.
 * Uses the active IPCRF configuration for each tier; if a tier has none, a
 * configuration is created from the seeded objectives (.2 strand for
 * Teacher I-III, .3 strand for Master Teachers).
 */
class DemoProcessSeeder extends Seeder
{
    private const RATER = 'demo.masterteacher@demo.local';
    private const PRINCIPAL = 'demo.principal@demo.local';

    /** [email, name, stage, gender] - all Teacher II, T1 - T3, SHS. */
    private array $stageTeachers = [
        ['demo.inprogress@demo.local', 'Carlo Mendoza (Demo)', 'in_progress', 'Male'],
        ['demo.forrating@demo.local', 'Liza Navarro (Demo)', 'for_rating', 'Female'],
        ['demo.forreview@demo.local', 'Ramon Aquino (Demo)', 'for_review', 'Male'],
        ['demo.completed@demo.local', 'Grace Villanueva (Demo)', 'completed', 'Female'],
    ];

    public function run(): void
    {
        if (! User::where('email', self::RATER)->exists() || ! User::where('email', self::PRINCIPAL)->exists()) {
            $this->call(DemoAccountSeeder::class);
        }

        $teacherConfig = $this->configFor('T1 - T3', '.2');
        $masterConfig = $this->configFor('MT1 - MT2', '.3');

        if (! $teacherConfig || ! $masterConfig) {
            $this->command->warn('DemoProcessSeeder: no objectives found - run IpcrfObjectiveSeeder first. Skipped.');

            return;
        }

        $this->resetDemoData();

        $rater = User::where('email', self::RATER)->first();
        $principal = User::where('email', self::PRINCIPAL)->first();
        $teacherObjectives = $this->objectivesFor($teacherConfig);
        $masterObjectives = $this->objectivesFor($masterConfig);
        $year = $teacherConfig->school_year;

        foreach ($this->stageTeachers as [$email, $name, $stage, $gender]) {
            $teacher = $this->stageTeacher($email, $name, $gender);
            mt_srand(crc32($email)); // same "random" ratings on every run

            if ($stage === 'in_progress') {
                $this->uploadMovs($teacher, $teacherObjectives->take((int) ceil($teacherObjectives->count() / 2)), $year);
                continue;
            }

            $submissions = $this->uploadMovs($teacher, $teacherObjectives, $year);
            $this->selfRatings($teacher, $teacherObjectives, $year);
            $this->survey($teacher, $year, $stage === 'completed' ? 'reviewed' : 'submitted');
            $this->shsQuestionnaire($teacher, $year);

            if ($stage === 'for_rating') {
                continue;
            }

            $this->rate($teacher, $submissions, $rater, $year);
            $this->signedIpcrf($teacher, $year, $stage === 'completed' ? $principal : null);
        }

        // Master Teacher: every MOV in, waiting for the Principal to rate.
        $this->uploadMovs($rater, $masterObjectives, $masterConfig->school_year);

        $this->command->info(sprintf(
            'DemoProcessSeeder: demo IPCRF process ready for SY %s (%d teacher objectives, %d Master Teacher objectives).',
            $year,
            $teacherObjectives->count(),
            $masterObjectives->count(),
        ));
    }

    /** The active configuration for a tier, or a new one built from the seeded objectives. */
    private function configFor(string $tier, string $codeSuffix): ?IpcrfConfiguration
    {
        $active = IpcrfConfiguration::where('is_active', true)->where('position_tier', $tier)->first();
        if ($active) {
            return $active;
        }

        $objectives = Objective::where('is_custom', false)
            ->where('is_active', true)
            ->where('code', 'like', '%' . $codeSuffix)
            ->orderBy('kra_id')
            ->orderBy('order')
            ->get();

        if ($objectives->isEmpty()) {
            return null;
        }

        $schoolYear = IpcrfConfiguration::where('is_active', true)->value('school_year') ?? $this->currentSchoolYear();
        $perKra = $objectives->groupBy('kra_id')->map->count()->values()->all();

        $config = IpcrfConfiguration::firstOrNew(['school_year' => $schoolYear, 'position_tier' => $tier]);
        if (! $config->exists) {
            $config->fill([
                'kra_count' => count($perKra),
                'objectives_per_kra' => $perKra,
                'selected_objective_ids' => $objectives->pluck('id')->all(),
                'notes' => 'Created by DemoProcessSeeder',
            ]);
        }
        $config->is_active = true;
        $config->is_locked = false;
        $config->save();

        return $config;
    }

    /** Same scope the teacher's IPCRF Tool uses: selected objectives + this config's custom ones. */
    private function objectivesFor(IpcrfConfiguration $config): Collection
    {
        $selected = $config->selected_objective_ids ?? [];

        return Objective::where('is_active', true)
            ->where(fn ($q) => $q->whereIn('id', $selected)->orWhere('ipcrf_configuration_id', $config->id))
            ->orderBy('kra_id')
            ->orderBy('order')
            ->get();
    }

    /** Wipe every @demo.local account's IPCRF records and uploaded files. */
    private function resetDemoData(): void
    {
        $ids = User::where('email', 'like', '%@demo.local')->pluck('id');

        foreach ($ids as $id) {
            foreach (['ipcrf-submissions', 'ipcrf-self-ratings', 'signed-ipcrfs'] as $folder) {
                Storage::disk('public')->deleteDirectory("{$folder}/{$id}");
            }
        }

        TeacherSubmission::whereIn('teacher_id', $ids)->delete();
        KraSelfRating::whereIn('teacher_id', $ids)->delete();
        TeacherQuestionnaire::whereIn('teacher_id', $ids)->delete();
        ShsQuestionnaireResponse::whereIn('teacher_id', $ids)->delete();
        SignedIpcrf::whereIn('teacher_id', $ids)->delete();
        IpcrfRating::whereIn('teacher_id', $ids)->delete();
    }

    private function stageTeacher(string $email, string $name, string $gender): User
    {
        $user = User::firstOrNew(['email' => $email]);
        if (! $user->exists) {
            $user->password = Hash::make('password');
        }
        $user->name = $name;
        $user->gender = $gender;
        $user->career_stage = 'Beginning Towards Proficient';
        $user->teacher_status = 'Permanent';
        $user->teacher_type = 'Permanent';
        $user->school_campus = 'ISAT-MAIN';
        $user->level = 'SHS';
        $user->is_active = true;
        $user->email_verified_at ??= now();
        $user->division = json_encode([
            'position_title' => 'Teacher II',
            'position_range' => 'T1 - T3',
            'career_stage' => 'Beginning Towards Proficient',
            'level' => 'SHS',
            'department' => null,
        ]);
        $user->save();
        $user->syncRoles(['teacher']);

        return $user;
    }

    /** One MOV per objective, as the IPCRF Tool's "Upload MOV" would store it. */
    private function uploadMovs(User $teacher, Collection $objectives, string $year): Collection
    {
        return $objectives->values()->map(function (Objective $objective, int $i) use ($teacher, $year) {
            $path = "ipcrf-submissions/{$teacher->id}/demo-mov-{$objective->code}.pdf";
            Storage::disk('public')->put($path, $this->pdf("MOV {$objective->code}", [
                $teacher->name,
                $objective->description,
                "Sample Mode of Verification - SY {$year}",
            ]));

            $submission = TeacherSubmission::create([
                'teacher_id' => $teacher->id,
                'objective_id' => $objective->id,
                'file_path' => $path,
                'notes' => $i === 0 ? 'Lesson plans and class observation report.' : null,
                'status' => 'submitted',
                'school_year' => $year,
            ]);
            $submission->forceFill(['created_at' => now()->subDays(30 - $i), 'updated_at' => now()->subDays(30 - $i)])->save();

            return $submission;
        });
    }

    /** One self-rating sheet per KRA, scored 3-5. */
    private function selfRatings(User $teacher, Collection $objectives, string $year): void
    {
        foreach ($objectives->pluck('kra_id')->unique() as $kraId) {
            $path = "ipcrf-self-ratings/{$teacher->id}/demo-self-rating-kra-{$kraId}.pdf";
            Storage::disk('public')->put($path, $this->pdf('Self-Rating Sheet', [$teacher->name, "KRA {$kraId} - SY {$year}"]));

            KraSelfRating::create([
                'teacher_id' => $teacher->id,
                'kra_id' => $kraId,
                'school_year' => $year,
                'file_path' => $path,
                'original_name' => "Self-Rating KRA {$kraId}.pdf",
                'self_rating' => mt_rand(3, 5),
                'notes' => 'Based on my MOVs for this KRA.',
            ]);
        }
    }

    /** The e-TRACES satisfaction survey, every statement answered 4 or 5. */
    private function survey(User $teacher, string $year, string $status): void
    {
        $template = QuestionnaireTemplate::where('key', 'etraces-self-assessment')->first();
        $count = $template ? count($template->structure['items'] ?? []) : 30;

        $responses = [];
        for ($i = 1; $i <= $count; $i++) {
            $responses["question_{$i}"] = mt_rand(4, 5);
        }

        TeacherQuestionnaire::create([
            'teacher_id' => $teacher->id,
            'school_year' => $year,
            'name' => $teacher->name,
            'sex' => $teacher->gender,
            'years_of_service' => '6-10',
            'last_ipcr_rating' => '4.2',
            'responses' => $responses,
            'status' => $status,
            'submitted_at' => now()->subDays(5),
        ]);
    }

    /** The SHS Performance & Challenges questionnaire, fully answered. */
    private function shsQuestionnaire(User $teacher, string $year): void
    {
        $template = QuestionnaireTemplate::where('key', 'shs-performance')->first();
        if (! $template) {
            return;
        }

        $answers = function (string $part, string $prefix) use ($template) {
            $ratings = [];
            foreach ($template->structure[$part]['kras'] ?? [] as $ki => $kra) {
                foreach ($kra['items'] as $item) {
                    $ratings["{$prefix}_{$ki}_{$item['no']}"] = $prefix === 'p' ? mt_rand(3, 5) : mt_rand(1, 4);
                }
            }

            return $ratings;
        };

        ShsQuestionnaireResponse::create([
            'teacher_id' => $teacher->id,
            'questionnaire_template_id' => $template->id,
            'school_year' => $year,
            'profile' => [
                'name' => $teacher->name,
                'age' => '34',
                'teaching_position' => 'Teacher II',
                'years_of_service' => '8',
                'bachelors_degree' => 'Bachelor of Technical-Vocational Teacher Education',
                'year_level_assignment' => 'Grade 11',
                'subject_taught' => 'Cookery NC II',
            ],
            'trainings' => [
                ['title' => 'Division Training on Contextualized Learning Materials', 'level' => 'Division', 'year' => (string) (now()->year - 1)],
                ['title' => 'School-based INSET on Assessment', 'level' => 'School-based', 'year' => (string) now()->year],
            ],
            'performance_ratings' => $answers('performance', 'p'),
            'challenge_ratings' => $answers('challenges', 'c'),
            'status' => 'submitted',
            'submitted_at' => now()->subDays(4),
        ]);
    }

    /** The rater's 1-5 rating on every MOV, plus the IPCRF rating it rolls up to. */
    private function rate(User $teacher, Collection $submissions, User $rater, string $year): void
    {
        $total = 0;
        foreach ($submissions as $submission) {
            $rating = mt_rand(3, 5);
            $total += $rating;
            $submission->update([
                'rating' => $rating,
                'status' => 'reviewed',
                'reviewed_by' => $rater->id,
                'reviewed_at' => now()->subDays(3),
                'feedback' => $rating === 5 ? 'Excellent evidence.' : null,
            ]);
        }

        $average = round($total / max($submissions->count(), 1), 2);

        IpcrfRating::create([
            'teacher_id' => $teacher->id,
            'rating_period' => $year,
            'school_year' => $year,
            'numerical_rating' => $average,
            'performance_level' => $this->performanceLevel($average),
            'total_score' => $average * 20,
            'status' => 'submitted',
            'kra_details' => [],
            'remarks' => 'Auto-generated from submission ratings',
            'created_by' => $rater->id,
        ]);
    }

    /** The signed IPCRF: waiting for review, or approved when a reviewer is given. */
    private function signedIpcrf(User $teacher, string $year, ?User $reviewer): void
    {
        $path = "signed-ipcrfs/{$teacher->id}/demo-signed-ipcrf.pdf";
        Storage::disk('public')->put($path, $this->pdf('Signed IPCRF', [$teacher->name, "SY {$year}", 'Signed by ratee and rater.']));

        $signed = SignedIpcrf::create([
            'teacher_id' => $teacher->id,
            'school_year' => $year,
            'file_path' => $path,
            'notes' => 'Signed copy, scanned.',
            'status' => $reviewer ? 'approved' : 'submitted',
            'admin_remarks' => $reviewer ? 'Complete and properly signed.' : null,
            'reviewed_by' => $reviewer?->id,
            'reviewed_at' => $reviewer ? now()->subDay() : null,
        ]);
        $signed->forceFill(['created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)])->save();
    }

    private function performanceLevel(float $rating): string
    {
        return match (true) {
            $rating >= 4.5 => 'Outstanding',
            $rating >= 3.5 => 'Very Satisfactory',
            $rating >= 2.5 => 'Satisfactory',
            $rating >= 1.5 => 'Unsatisfactory',
            default => 'Poor',
        };
    }

    private function currentSchoolYear(): string
    {
        $year = now()->month >= 6 ? now()->year : now()->year - 1;

        return $year . '-' . ($year + 1);
    }

    /** A small one-page PDF with a title and a few lines of text. */
    private function pdf(string $title, array $lines): string
    {
        $esc = fn (string $s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], mb_strimwidth($s, 0, 90, '...'));

        $text = "BT /F1 20 Tf 72 770 Td ({$esc($title)}) Tj /F1 12 Tf";
        foreach ($lines as $line) {
            $text .= " 0 -24 Td ({$esc($line)}) Tj";
        }
        $text .= ' 0 -36 Td (DEMO FILE - for testing only) Tj ET';

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length ' . strlen($text) . " >>\nstream\n{$text}\nendstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $body) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1) . " 0 obj\n{$body}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref' . "\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf . 'trailer << /Size ' . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
