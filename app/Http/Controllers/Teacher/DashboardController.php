<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\IpcrfConfiguration;
use App\Models\IpcrfRating;
use App\Models\Objective;
use App\Models\TeacherSubmission;
use App\Models\SignedIpcrf;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $teacherId = auth()->id();

        // Load user with position relationship
        $user = auth()->user()->load('currentPosition');

        // Parse division JSON to get position info
        $divisionData = json_decode($user->division, true);
        if (is_array($divisionData)) {
            $user->position_range = $divisionData['position_range'] ?? null;
            $user->position_career_stage = $divisionData['career_stage'] ?? null;
            $user->department = $divisionData['department'] ?? null;
        }

        // Same configuration the IPCRF Tool uses for this teacher's tier, falling
        // back to any active configuration so the deadline reminder still shows.
        $activeConfig = IpcrfConfiguration::getActiveConfigForTier($user->position_range ?? null)
            ?? IpcrfConfiguration::where('is_active', true)->first();

        // Get current year submissions
        $submissions = [];
        $signedIpcrf = null;
        $stats = null;

        if ($activeConfig) {
            $submissions = TeacherSubmission::where('teacher_id', $teacherId)
                ->where('school_year', $activeConfig->school_year)
                ->get();

            $signedIpcrf = SignedIpcrf::where('teacher_id', $teacherId)
                ->where('school_year', $activeConfig->school_year)
                ->first();

            $stats = $this->stats($activeConfig, $submissions);
        }

        return Inertia::render('Teacher/Dashboard', [
            'user' => $user,
            'activeConfig' => $activeConfig,
            'submissions' => $submissions,
            'signedIpcrf' => $signedIpcrf,
            'stats' => $stats,
        ]);
    }

    /**
     * Progress numbers for the dashboard's IPCRF card and stat cards.
     */
    private function stats(IpcrfConfiguration $config, $submissions): array
    {
        // Objectives this configuration asks for - same scope as the IPCRF Tool.
        $selectedObjectiveIds = $config->selected_objective_ids ?? [];
        $requiredObjectiveIds = Objective::where('is_active', true)
            ->where(function ($q) use ($selectedObjectiveIds, $config) {
                $q->whereIn('id', $selectedObjectiveIds)
                  ->orWhere('ipcrf_configuration_id', $config->id);
            })
            ->pluck('id');

        $withEvidence = $submissions
            ->whereIn('objective_id', $requiredObjectiveIds)
            ->pluck('objective_id')
            ->unique()
            ->count();

        $rated = $submissions->whereNotNull('rating');

        // The School Head's final rating for the year, once it exists.
        $finalRating = IpcrfRating::where('teacher_id', auth()->id())
            ->where('school_year', $config->school_year)
            ->latest()
            ->first();

        $daysLeft = null;
        if ($config->submission_end_date) {
            $daysLeft = (int) now()->startOfDay()->diffInDays(
                Carbon::parse($config->submission_end_date)->startOfDay(),
                false
            );
        }

        return [
            'objectives_total' => $requiredObjectiveIds->count(),
            'objectives_with_evidence' => $withEvidence,
            'files_submitted' => $submissions->count(),
            'rated_count' => $rated->count(),
            'average_rating' => $rated->count() ? round($rated->avg('rating'), 3) : null,
            'final_rating' => $finalRating?->numerical_rating,
            'performance_level' => $finalRating?->performance_level,
            'days_left' => $daysLeft,
        ];
    }
}
