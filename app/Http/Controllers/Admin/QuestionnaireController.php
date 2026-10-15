<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KraSelfRating;
use App\Models\QuestionnaireTemplate;
use App\Models\ShsQuestionnaireResponse;
use App\Models\TeacherQuestionnaire;
use App\Models\User;
use Database\Seeders\EtracesSurveySeeder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Admin view over everything teachers submit for a school year:
 *   - Self-Assessment Survey  (teacher_questionnaires / e-TRACES)
 *   - SHS Performance & Challenges  (shs_questionnaire_responses)
 *   - KRA Self-Rating uploads  (kra_self_ratings)
 *
 * The list rolls all three up per teacher + school year; the detail page shows
 * every input, rating and upload for one teacher.
 */
class QuestionnaireController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', 'all');
        $year = $request->input('school_year');

        $surveys = TeacherQuestionnaire::with('teacher:id,name,email')->get();
        $shs = ShsQuestionnaireResponse::with(['teacher:id,name,email'])->get();
        $selfRatings = KraSelfRating::with('teacher:id,name,email')->get();

        // One roll-up row per teacher + school year.
        $rows = collect();

        $ensureRow = function (&$rows, $teacher, $schoolYear) {
            $key = $teacher->id.'|'.$schoolYear;
            if (! $rows->has($key)) {
                $rows->put($key, [
                    'key' => $key,
                    'teacher' => ['id' => $teacher->id, 'name' => $teacher->name, 'email' => $teacher->email],
                    'school_year' => $schoolYear,
                    'has_survey' => false,
                    'has_shs' => false,
                    'self_rating_count' => 0,
                    'statuses' => [],
                    'last_activity' => null,
                ]);
            }

            return $key;
        };

        foreach ($surveys as $s) {
            if (! $s->teacher) {
                continue;
            }
            $k = $ensureRow($rows, $s->teacher, $s->school_year);
            $row = $rows->get($k);
            $row['has_survey'] = true;
            $row['statuses'][] = $s->status;
            $row['last_activity'] = max($row['last_activity'], optional($s->updated_at)->toDateTimeString());
            $rows->put($k, $row);
        }

        foreach ($shs as $r) {
            if (! $r->teacher) {
                continue;
            }
            $k = $ensureRow($rows, $r->teacher, $r->school_year);
            $row = $rows->get($k);
            $row['has_shs'] = true;
            $row['statuses'][] = $r->status;
            $row['last_activity'] = max($row['last_activity'], optional($r->updated_at)->toDateTimeString());
            $rows->put($k, $row);
        }

        foreach ($selfRatings as $sr) {
            if (! $sr->teacher) {
                continue;
            }
            $k = $ensureRow($rows, $sr->teacher, $sr->school_year);
            $row = $rows->get($k);
            $row['self_rating_count']++;
            $row['last_activity'] = max($row['last_activity'], optional($sr->updated_at)->toDateTimeString());
            $rows->put($k, $row);
        }

        $rows = $rows->values()->map(function ($row) {
            $statuses = $row['statuses'];
            $row['status'] = in_array('draft', $statuses, true) && ! in_array('submitted', $statuses, true) && ! in_array('reviewed', $statuses, true)
                ? 'draft'
                : (in_array('reviewed', $statuses, true) && ! in_array('submitted', $statuses, true) && ! in_array('draft', $statuses, true)
                    ? 'reviewed'
                    : (empty($statuses) ? 'uploads_only' : 'submitted'));
            unset($row['statuses']);

            return $row;
        });

        // Filters
        if ($search !== '') {
            $rows = $rows->filter(fn ($r) => str_contains(strtolower($r['teacher']['name']), strtolower($search))
                || str_contains(strtolower($r['teacher']['email']), strtolower($search)));
        }
        if ($year) {
            $rows = $rows->filter(fn ($r) => $r['school_year'] === $year);
        }
        if ($status && $status !== 'all') {
            $rows = $rows->filter(fn ($r) => $r['status'] === $status);
        }

        $rows = $rows->sortByDesc('last_activity')->values();

        $schoolYears = $surveys->pluck('school_year')
            ->merge($shs->pluck('school_year'))
            ->merge($selfRatings->pluck('school_year'))
            ->filter()->unique()->sortDesc()->values();

        $yearScope = fn ($c) => $year ? $c->where('school_year', $year) : $c;

        $stats = [
            'total_submissions' => $rows->count(),
            'submitted' => $yearScope($surveys->concat($shs))->whereIn('status', ['submitted', 'reviewed'])->count(),
            'draft' => $yearScope($surveys->concat($shs))->where('status', 'draft')->count(),
            'reviewed' => $yearScope($surveys->concat($shs))->where('status', 'reviewed')->count(),
            'self_rating_uploads' => $yearScope($selfRatings)->count(),
            'average_years_of_service' => $this->avg($shs, fn ($r) => $this->numeric($r->profile['years_of_service'] ?? null)),
            'average_age' => $this->avg($shs, fn ($r) => $this->numeric($r->profile['age'] ?? null)),
        ];

        return Inertia::render('Admin/QuestionnaireResults', [
            'questionnaires' => $rows,
            'schoolYears' => $schoolYears,
            'filters' => ['status' => $status, 'school_year' => $year, 'search' => $search],
            'stats' => $stats,
        ]);
    }

    public function show(Request $request, User $teacher, ?string $year = null)
    {
        $year ??= $this->latestYearFor($teacher->id);

        $survey = TeacherQuestionnaire::where('teacher_id', $teacher->id)
            ->when($year, fn ($q) => $q->where('school_year', $year))
            ->latest('updated_at')->first();

        $shs = ShsQuestionnaireResponse::with('template')
            ->where('teacher_id', $teacher->id)
            ->when($year, fn ($q) => $q->where('school_year', $year))
            ->latest('updated_at')->first();

        $selfRatings = KraSelfRating::with('kra:id,name')
            ->where('teacher_id', $teacher->id)
            ->when($year, fn ($q) => $q->where('school_year', $year))
            ->orderBy('kra_id')->orderByDesc('created_at')
            ->get()
            ->map(fn ($sr) => [
                'id' => $sr->id,
                'kra' => $sr->kra->name ?? ('KRA #'.$sr->kra_id),
                'original_name' => $sr->original_name,
                'file_url' => $sr->file_path ? route('admin.questionnaire.self-rating.document', $sr->id) : null,
                'self_rating' => $sr->self_rating !== null ? (float) $sr->self_rating : null,
                'notes' => $sr->notes,
                'uploaded_at' => optional($sr->created_at)->toDateTimeString(),
            ]);

        $availableYears = collect([
            TeacherQuestionnaire::where('teacher_id', $teacher->id)->pluck('school_year'),
            ShsQuestionnaireResponse::where('teacher_id', $teacher->id)->pluck('school_year'),
            KraSelfRating::where('teacher_id', $teacher->id)->pluck('school_year'),
        ])->flatten()->filter()->unique()->sortDesc()->values();

        return Inertia::render('Admin/QuestionnaireDetail', [
            'teacher' => ['id' => $teacher->id, 'name' => $teacher->name, 'email' => $teacher->email],
            'year' => $year,
            'availableYears' => $availableYears,
            'survey' => $survey,
            'surveyTemplate' => QuestionnaireTemplate::where('key', EtracesSurveySeeder::KEY)->first(),
            'shs' => $shs,
            'shsTemplate' => $shs?->template,
            'selfRatings' => $selfRatings,
        ]);
    }

    /** Mark the e-TRACES self-assessment survey submitted / reviewed. */
    public function updateStatus(Request $request, TeacherQuestionnaire $questionnaire)
    {
        $request->validate(['status' => 'required|in:draft,submitted,reviewed']);
        $questionnaire->update(['status' => $request->status]);

        return back()->with('success', 'Questionnaire status updated.');
    }

    private function latestYearFor(int $teacherId): ?string
    {
        return collect([
            TeacherQuestionnaire::where('teacher_id', $teacherId)->max('school_year'),
            ShsQuestionnaireResponse::where('teacher_id', $teacherId)->max('school_year'),
            KraSelfRating::where('teacher_id', $teacherId)->max('school_year'),
        ])->filter()->sortDesc()->first();
    }

    private function numeric($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (preg_match('/\d+(\.\d+)?/', (string) $value, $m)) {
            return (float) $m[0];
        }

        return null;
    }

    private function avg($collection, callable $pick): ?float
    {
        $vals = $collection->map($pick)->filter(fn ($v) => $v !== null);

        return $vals->isEmpty() ? null : round($vals->avg(), 1);
    }
}
