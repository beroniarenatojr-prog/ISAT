<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IpcrfRating;
use App\Models\TeacherSubmission;
use App\Models\TeacherQuestionnaire;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IpcrfHistoryController extends Controller
{
    /** MOV uploads per page - the only high-volume table here. */
    private const MOVS_PER_PAGE = 25;

    /**
     * IPCRF History: every MOV upload, IPCRF rating and e-TRACES survey,
     * grouped by school year and filterable by School Year / Teacher.
     *
     * MOV uploads are paginated (a teacher can have many, across 100+ teachers);
     * ratings and surveys are ~one per teacher per year, so they are shown in
     * full for whichever school years appear on the current MOV page.
     */
    public function index(Request $request)
    {
        $schoolYear = $request->input('school_year') ?: null;
        $teacherId = $request->input('teacher_id') ?: null;
        $search = trim((string) $request->input('search', '')) ?: null;

        $schoolYears = collect()
            ->merge(IpcrfRating::query()->distinct()->pluck('rating_period'))
            ->merge(TeacherSubmission::query()->distinct()->pluck('school_year'))
            ->merge(TeacherQuestionnaire::query()->distinct()->pluck('school_year'))
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        $teachers = User::role('teacher')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        $scoped = fn ($query, string $yearColumn) => $query
            ->when($schoolYear, fn ($q) => $q->where($yearColumn, $schoolYear))
            ->when($teacherId, fn ($q) => $q->where('teacher_id', $teacherId))
            ->when($search, fn ($q) => $q->whereHas('teacher', fn ($t) => $t
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")));

        // --- MOV uploads (paginated) ---
        $movs = $scoped(
            TeacherSubmission::with([
                'teacher:id,name,email',
                'objective:id,code,description,kra_id',
            ]),
            'school_year'
        )
            ->orderByRaw('school_year IS NULL, school_year DESC')
            ->orderBy('created_at', 'desc')
            ->paginate(self::MOVS_PER_PAGE)
            ->withQueryString();

        $movItems = collect($movs->items());
        $yearsOnPage = $movItems->pluck('school_year')->filter()->unique()->values();

        // Per-year MOV totals (so a year header can say "showing 5 of 63")
        $movTotalsByYear = $scoped(TeacherSubmission::query(), 'school_year')
            ->selectRaw('school_year, count(*) as c')
            ->groupBy('school_year')
            ->pluck('c', 'school_year');

        // --- Ratings + surveys for the school years shown on this page ---
        $ratings = $scoped(IpcrfRating::with('teacher:id,name,email'), 'rating_period')
            ->when($yearsOnPage->isNotEmpty(), fn ($q) => $q->whereIn('rating_period', $yearsOnPage))
            ->orderBy('rating_period', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $surveys = $scoped(TeacherQuestionnaire::with('teacher:id,name,email'), 'school_year')
            ->when($yearsOnPage->isNotEmpty(), fn ($q) => $q->whereIn('school_year', $yearsOnPage))
            ->orderBy('school_year', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $groups = $yearsOnPage->map(fn ($year) => [
            'year' => $year,
            'submissions' => $movItems->where('school_year', $year)->values(),
            'submissions_total' => (int) ($movTotalsByYear[$year] ?? 0),
            'ratings' => $ratings->where('rating_period', $year)->values(),
            'surveys' => $surveys->where('school_year', $year)->values(),
        ])->values();

        return Inertia::render('Admin/IpcrfHistory', [
            'groups' => $groups,
            'movsPagination' => [
                'links' => $movs->linkCollection(),
                'from' => $movs->firstItem(),
                'to' => $movs->lastItem(),
                'total' => $movs->total(),
                'current_page' => $movs->currentPage(),
                'last_page' => $movs->lastPage(),
            ],
            'schoolYears' => $schoolYears,
            'teachers' => $teachers,
            'filters' => [
                'school_year' => $schoolYear,
                'teacher_id' => $teacherId ? (int) $teacherId : null,
                'search' => $search,
            ],
            'totals' => [
                'submissions' => $scoped(TeacherSubmission::query(), 'school_year')->count(),
                'ratings' => $scoped(IpcrfRating::query(), 'rating_period')->count(),
                'surveys' => $scoped(TeacherQuestionnaire::query(), 'school_year')->count(),
                'average_rating' => $scoped(IpcrfRating::query(), 'rating_period')->avg('numerical_rating'),
            ],
        ]);
    }
}
