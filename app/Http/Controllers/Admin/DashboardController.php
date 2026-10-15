<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TeacherSubmission;
use App\Models\IpcrfConfiguration;
use App\Models\IpcrfRating;
use App\Models\AuditLog;
use App\Models\PendingAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // Basic Stats
        $stats = [
            'total_users' => User::count(),
            'total_teachers' => User::role('teacher')->count(),
            'total_admins' => User::role('admin')->count(),
            'total_super_admins' => User::role('super-admin')->count(),
        ];

        // ---- IPCRF submissions: scoped to a school year (defaults to the active one) ----
        $activeYear = IpcrfConfiguration::where('is_active', true)
            ->orderByDesc('school_year')
            ->value('school_year');

        // Every school year that has either a configuration or at least one submission
        $availableYears = TeacherSubmission::query()->distinct()->pluck('school_year')
            ->merge(IpcrfConfiguration::query()->distinct()->pluck('school_year'))
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        $selectedYear = $request->input('ipcrf_year')
            ?: ($activeYear ?: $availableYears->first());

        $yearScope = fn ($query) => $query->when($selectedYear, fn ($q) => $q->where('school_year', $selectedYear));
        $ratingYearScope = fn ($query) => $query->when($selectedYear, fn ($q) => $q->where('rating_period', $selectedYear));

        // IPCRF Stats (for the selected school year)
        $ipcrfStats = [
            // Number of teachers who have submitted at least one MOV for the year
            'total_submissions' => (int) $yearScope(TeacherSubmission::query())
                ->distinct('teacher_id')->count('teacher_id'),
            // Raw MOV records, used for review-progress ratios
            'submission_records' => $yearScope(TeacherSubmission::query())->count(),
            'pending_submissions' => $yearScope(TeacherSubmission::query())->where('status', 'pending')->count(),
            'reviewed_submissions' => $yearScope(TeacherSubmission::query())->where('status', 'reviewed')->count(),
            'total_ratings' => $ratingYearScope(IpcrfRating::query())->count(),
            'average_rating' => $ratingYearScope(IpcrfRating::query())->avg('numerical_rating') ?? 0,
        ];

        // Pending Actions
        $pendingActions = [
            'total_pending' => PendingAction::where('status', 'pending')->count(),
            'approved_today' => PendingAction::where('status', 'approved')
                ->whereDate('updated_at', today())
                ->count(),
            'rejected_today' => PendingAction::where('status', 'rejected')
                ->whereDate('updated_at', today())
                ->count(),
        ];

        // Recent Activities (Last 10)
        $recentActivities = AuditLog::with('user')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user_name' => $log->user->name ?? 'System',
                    'created_at' => $log->created_at->diffForHumans(),
                ];
            });

        // Submissions Trend (Last 7 days)
        $submissionsTrend = TeacherSubmission::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'count' => $item->count,
                ];
            });

        // Ratings Distribution
        $ratingsDistribution = IpcrfRating::select(
                DB::raw('FLOOR(numerical_rating) as rating'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('rating')
            ->orderBy('rating')
            ->get()
            ->map(function ($item) {
                return [
                    'rating' => (int) $item->rating,
                    'count' => $item->count,
                ];
            });

        // Monthly Submissions (Last 6 months)
        $monthlySubmissions = TeacherSubmission::select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => Carbon::create($item->year, $item->month)->format('M Y'),
                    'count' => $item->count,
                ];
            });

        // Status Distribution
        $statusDistribution = TeacherSubmission::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => ucfirst($item->status),
                    'count' => $item->count,
                ];
            });

        // Top Rated Teachers (Top 5)
        $topRatedTeachers = IpcrfRating::with('teacher')
            ->select('teacher_id', DB::raw('AVG(numerical_rating) as avg_rating'))
            ->groupBy('teacher_id')
            ->orderByDesc('avg_rating')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->teacher->name ?? 'Unknown',
                    'rating' => round($item->avg_rating, 2),
                ];
            });

        // System Alerts
        $systemAlerts = [
            'unreviewed_submissions' => TeacherSubmission::whereNull('reviewed_at')->count(),
            'pending_approvals' => PendingAction::where('status', 'pending')->count(),
            'teachers_without_ratings' => User::role('teacher')
                ->whereDoesntHave('ipcrfRatings')
                ->count(),
        ];

        // ---- Trends: each stat card vs. its value 30 days ago ----
        // "Previous" = how things looked before $cut, so the delta reflects what
        // actually changed as users submit MOVs, get rated, resolve actions, etc.
        $cut = Carbon::now()->subDays(30);

        $prevUsers = User::where('created_at', '<', $cut)->count();
        $prevTeachers = User::role('teacher')->where('created_at', '<', $cut)->count();
        $prevSubmitters = (int) $yearScope(TeacherSubmission::query())
            ->where('created_at', '<', $cut)
            ->distinct('teacher_id')->count('teacher_id');
        $prevPendingReviews = $yearScope(TeacherSubmission::query())
            ->where('status', 'pending')->where('created_at', '<', $cut)->count();
        $prevReviewed = $yearScope(TeacherSubmission::query())
            ->where('status', 'reviewed')->where('reviewed_at', '<', $cut)->count();
        $prevAvgRating = (float) ($ratingYearScope(IpcrfRating::query())
            ->where('created_at', '<', $cut)->avg('numerical_rating') ?? 0);
        $prevPendingActions = PendingAction::where('status', 'pending')
            ->where('created_at', '<', $cut)->count();
        $prevAlerts = TeacherSubmission::whereNull('reviewed_at')->where('created_at', '<', $cut)->count()
            + PendingAction::where('status', 'pending')->where('created_at', '<', $cut)->count();

        $currentAlerts = $systemAlerts['unreviewed_submissions'] + $systemAlerts['pending_approvals'];

        $trends = [
            // more == better: green on increase
            'total_users' => $this->percentTrend($stats['total_users'], $prevUsers, true),
            'total_teachers' => $this->percentTrend($stats['total_teachers'], $prevTeachers, true),
            'ipcrf_submissions' => $this->percentTrend($ipcrfStats['total_submissions'], $prevSubmitters, true),
            'completed_reviews' => $this->percentTrend($ipcrfStats['reviewed_submissions'], $prevReviewed, true),
            'average_rating' => $this->deltaTrend(
                round((float) $ipcrfStats['average_rating'], 2),
                round($prevAvgRating, 2),
                2,
                true,
            ),
            // fewer == better: green on decrease
            'pending_reviews' => $this->countTrend($ipcrfStats['pending_submissions'], $prevPendingReviews, false),
            'pending_actions' => $this->countTrend($pendingActions['total_pending'], $prevPendingActions, false),
            'system_alerts' => $this->countTrend($currentAlerts, $prevAlerts, false),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'ipcrfStats' => $ipcrfStats,
            'ipcrfYear' => $selectedYear,
            'ipcrfActiveYear' => $activeYear,
            'availableIpcrfYears' => $availableYears,
            'pendingActions' => $pendingActions,
            'recentActivities' => $recentActivities,
            'submissionsTrend' => $submissionsTrend,
            'ratingsDistribution' => $ratingsDistribution,
            'monthlySubmissions' => $monthlySubmissions,
            'statusDistribution' => $statusDistribution,
            'topRatedTeachers' => $topRatedTeachers,
            'systemAlerts' => $systemAlerts,
            'trends' => $trends,
            'isSuperAdmin' => auth()->user()->hasRole('super-admin'),
        ]);
    }

    /**
     * Percentage change vs. a previous value.
     *
     * @param  bool  $moreIsBetter  whether an increase should read as positive
     * @return array{label:string, positive:bool|null}
     */
    private function percentTrend(int|float $current, int|float $previous, bool $moreIsBetter): array
    {
        $diff = $current - $previous;

        if ($previous <= 0) {
            $pct = $current > 0 ? 100 : 0;
        } else {
            $pct = (int) round($diff / $previous * 100);
        }

        return [
            'label' => sprintf('%s%d%%', $pct > 0 ? '+' : '', $pct),
            'positive' => $this->sentiment($diff, $moreIsBetter),
        ];
    }

    /** Absolute count change, rendered as "+N" / "-N". */
    private function countTrend(int $current, int $previous, bool $moreIsBetter): array
    {
        $diff = $current - $previous;

        return [
            'label' => sprintf('%s%d', $diff > 0 ? '+' : '', $diff),
            'positive' => $this->sentiment($diff, $moreIsBetter),
        ];
    }

    /** Absolute change for a decimal metric (e.g. average rating). */
    private function deltaTrend(float $current, float $previous, int $decimals, bool $moreIsBetter): array
    {
        $diff = round($current - $previous, $decimals);

        return [
            'label' => sprintf('%s%s', $diff > 0 ? '+' : '', number_format($diff, $decimals)),
            'positive' => $this->sentiment($diff, $moreIsBetter),
        ];
    }

    /** true = good change, false = bad change, null = no change. */
    private function sentiment(int|float $diff, bool $moreIsBetter): ?bool
    {
        if ($diff == 0) {
            return null;
        }

        return ($diff > 0) === $moreIsBetter;
    }
}
