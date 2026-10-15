<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kra;
use App\Models\Objective;
use App\Models\Competency;
use App\Models\TeacherSubmission;
use App\Models\IpcrfRating;
use App\Models\IpcrfConfiguration;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IpcrfManagementController extends Controller
{
    public function index()
    {
        $kras = Kra::with(['objectives.competencies'])
            ->orderBy('order')
            ->get();

        return Inertia::render('Admin/IpcrfManagement', [
            'kras' => $kras,
        ]);
    }

    public function submissions(Request $request)
    {
        $search = $request->input('search', '');
        $statusFilter = $request->input('status', '');
        $yearFilter = $request->input('year', '');
        $hasUploads = $request->boolean('has_uploads');
        $positionFilter = $request->input('position', '');

        // Position tiers the current rater can filter by.
        //   Administrator (super-admin + teacher) -> every tier, unfiltered
        //   Principal (super-admin)               -> every tier, Master Teachers by default
        //   Master Teacher (admin)                -> Teacher tiers only
        $rater = auth()->user();
        $raterIsAdministrator = $rater->isAdministrator();
        $raterIsPrincipal = $rater->hasRole('super-admin');
        $positionOptions = $raterIsPrincipal
            ? ['T1 - T3', 'T4 - T7', 'MT1 - MT2', 'MT3 - MT5']
            : ['T1 - T3', 'T4 - T7'];

        // Active configurations are now defined per position tier
        $activeConfigs = IpcrfConfiguration::where('is_active', true)->get();
        $currentSchoolYear = $activeConfigs->first()->school_year ?? null;

        // Each tier's active config can target a DIFFERENT school year, so MOV
        // counts must use the school year of the teacher's own tier config,
        // not one global "current" year.
        $schoolYearByTier = $activeConfigs
            ->filter(fn ($config) => $config->position_tier)
            ->mapWithKeys(fn ($config) => [$config->position_tier => $config->school_year]);

        // Which tier the rater is currently looking at (drives the has_uploads filter).
        $validPosition = $positionFilter && in_array($positionFilter, $positionOptions, true);
        $scopeTier = $validPosition
            ? $positionFilter
            : ($raterIsPrincipal ? 'MT1 - MT2' : 'T1 - T3');
        // The Administrator's default view spans every tier, so no single tier's
        // school year applies - leave it null so has_uploads matches any MOV.
        $scopeSchoolYear = ($raterIsAdministrator && ! $validPosition)
            ? null
            : ($schoolYearByTier[$scopeTier] ?? $currentSchoolYear);

        // Expected objective count per position tier, taken from each tier's configuration
        $objectiveTotalsByTier = $activeConfigs
            ->filter(fn ($config) => $config->position_tier)
            ->mapWithKeys(fn ($config) => [
                $config->position_tier => count($config->selected_objective_ids ?? []),
            ]);

        // Fallback for teachers with no tier (or no tier-specific configuration)
        $fallbackConfig = $activeConfigs->firstWhere('position_tier', null);
        $fallbackTotal = $fallbackConfig
            ? count($fallbackConfig->selected_objective_ids ?? [])
            : Objective::where('is_active', true)->count();

        $query = User::role('teacher')
            ->with([
                'currentPosition', 
                'ipcrfRatings' => function ($q) {
                    // Load ALL ratings for rating history display (no year filter here)
                    $q->orderBy('rating_period', 'desc')->orderBy('created_at', 'desc');
                },
                // All MOV submissions across every school year, newest first,
                // so the Rating Records view can group them by year.
                'teacherSubmissions' => function ($q) {
                    $q->with('objective:id,code,description,kra_id')
                        ->orderBy('school_year', 'desc')
                        ->orderBy('created_at', 'desc');
                }
            ])
            ->withMax('ipcrfRatings as latest_rating_date', 'created_at')
            // Baseline count (all years). Overwritten per-teacher below with the
            // count for that teacher's own tier / school year.
            ->withCount('teacherSubmissions as mov_uploads_count');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Only teachers who have actually submitted a MOV (the "MOV Uploads"
        // column would show a number other than 0), for the school year of the
        // tier currently being viewed.
        if ($hasUploads) {
            $query->whereHas('teacherSubmissions', function ($q) use ($scopeSchoolYear) {
                if ($scopeSchoolYear) {
                    $q->where('school_year', $scopeSchoolYear);
                }
            });
        }

        $ratingScope = $raterIsPrincipal ? 'master_teacher' : 'teacher';

        if ($validPosition) {
            // An explicit position pick sets the scope (within what the rater may see).
            $query->where('division', 'like', '%"position_range":"' . $positionFilter . '"%');
        } elseif ($raterIsAdministrator) {
            // Administrator: every teacher in every position tier - no restriction.
        } elseif ($ratingScope === 'master_teacher') {
            // Principal default view: Master Teacher tiers.
            $query->where('division', 'like', '%"position_range":"MT%');
        } else {
            // Master Teacher: never the MT tiers.
            $query->where(function ($q) {
                $q->whereNull('division')
                    ->orWhere('division', 'not like', '%"position_range":"MT%');
            });
        }

        // Order by latest IPCRF rating submission date (most recent first)
        $teachers = $query->orderByDesc('latest_rating_date')
            ->orderBy('name') // Secondary sort by name for teachers without ratings
            ->paginate(10);

        // Parse division JSON for each teacher; resolve the MOV count / expected
        // total against THAT teacher's own tier config (which may target a
        // different school year than the rater's default view).
        $teachers->getCollection()->transform(function ($teacher) use ($objectiveTotalsByTier, $fallbackTotal, $schoolYearByTier, $currentSchoolYear) {
            $divisionData = json_decode($teacher->division, true);
            $teacher->position_range = is_array($divisionData) ? ($divisionData['position_range'] ?? null) : null;
            $teacher->position_career_stage = is_array($divisionData) ? ($divisionData['career_stage'] ?? null) : null;
            $teacher->expected_movs = $objectiveTotalsByTier[$teacher->position_range] ?? $fallbackTotal;

            $tierYear = $schoolYearByTier[$teacher->position_range] ?? $currentSchoolYear;
            $teacher->mov_uploads_count = $tierYear
                ? $teacher->teacherSubmissions->where('school_year', $tierYear)->count()
                : $teacher->teacherSubmissions->count();

            return $teacher;
        });

        // Get available years from ratings
        $availableYears = IpcrfRating::select('rating_period')
            ->distinct()
            ->orderBy('rating_period', 'desc')
            ->pluck('rating_period');

        // Get KRAs for rating form
        $kras = Kra::with('objectives')->orderBy('order')->get();

        return Inertia::render('Admin/IpcrfSubmissions', [
            'teachers' => $teachers,
            'availableYears' => $availableYears,
            'kras' => $kras,
            'totalObjectives' => $fallbackTotal,
            'currentSchoolYear' => $currentSchoolYear,
            'ratingScope' => [
                'tier' => $ratingScope,
                'label' => $validPosition
                    ? $positionFilter
                    : ($raterIsAdministrator
                        ? 'all positions'
                        : ($raterIsPrincipal ? 'Master Teacher I-V' : 'Teacher I-VII')),
                'raterRole' => $rater->roleLabel(),
                'allTiers' => $raterIsPrincipal,
            ],
            'positionOptions' => $positionOptions,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'year' => $yearFilter,
                'has_uploads' => $hasUploads,
                'position' => $positionFilter,
            ],
        ]);
    }

    public function rateTeacher(User $teacher, Request $request)
    {
        // Ensure the user is a teacher
        if (!$teacher->hasRole('teacher')) {
            return redirect()->route('admin.ipcrf.submissions')
                ->with('error', 'Invalid teacher selected.');
        }

        // Tier check: a Master Teacher (admin) may not rate a Master Teacher (MT tier).
        if (! auth()->user()->canRateIpcrfTier($teacher->ipcrfTier())) {
            return redirect()->route('admin.ipcrf.submissions')
                ->with('error', 'You are not allowed to rate this teacher. Master Teachers rate Teacher I-VII; the Principal rates Master Teacher I-V.');
        }

        // School year: only filter when the rater explicitly picks one. With
        // nothing chosen (first load or "All School Years") show EVERY MOV the
        // teacher submitted - the previous code defaulted to a single active
        // config's year, which hid submissions made under a different tier/year.
        $schoolYear = trim((string) $request->input('school_year', '')) ?: null;

        // Get available school years for this teacher
        $availableYears = TeacherSubmission::where('teacher_id', $teacher->id)
            ->select('school_year')
            ->distinct()
            ->orderBy('school_year', 'desc')
            ->pluck('school_year');

        // Get teacher's IPCRF submissions with related data for selected year
        $query = TeacherSubmission::where('teacher_id', $teacher->id)
            ->with(['objective.kra', 'competency']);

        if ($schoolYear) {
            $query->where('school_year', $schoolYear);
        }

        $submissions = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/RateIpcrfPdf', [
            'teacher' => $teacher->load('currentPosition'),
            'submissions' => $submissions,
            'availableYears' => $availableYears,
            'selectedYear' => $schoolYear,
            'auth' => [
                'user' => auth()->user()->load('roles'),
            ],
        ]);
    }

    public function storeSubmissionRatings(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'ratings' => 'required|array',
            'ratings.*.submission_id' => 'required|exists:teacher_submissions,id',
            'ratings.*.rating' => 'required|integer|min:1|max:5',
        ], [
            'ratings.required' => 'Please provide ratings for all submissions.',
            'ratings.*.rating.required' => 'Each submission must have a rating.',
            'ratings.*.rating.min' => 'Rating must be at least 1 star.',
            'ratings.*.rating.max' => 'Rating cannot exceed 5 stars.',
        ]);

        $teacherId = $request->teacher_id;

        // Tier check: block a Master Teacher (admin) from rating a Master Teacher (MT tier).
        $ratee = User::find($teacherId);
        if ($ratee && ! auth()->user()->canRateIpcrfTier($ratee->ipcrfTier())) {
            return redirect()->route('admin.ipcrf.submissions')
                ->with('error', 'You are not allowed to rate this teacher. Master Teachers rate Teacher I-VII; the Principal rates Master Teacher I-V.');
        }

        $totalRating = 0;
        $submissionCount = count($request->ratings);

        // Update each submission with its rating
        foreach ($request->ratings as $ratingData) {
            TeacherSubmission::where('id', $ratingData['submission_id'])
                ->update([
                    'rating' => $ratingData['rating'],
                    'status' => 'reviewed',
                    'reviewed_by' => auth()->id(),
                    'reviewed_at' => now(),
                ]);
            
            $totalRating += $ratingData['rating'];
        }

        // Calculate average rating
        $averageRating = $submissionCount > 0 ? round($totalRating / $submissionCount, 2) : 0;

        // Get current year for rating period
        $ratingPeriod = now()->year . '-' . (now()->year + 1);

        // Create or update IPCRF Rating record
        $ipcrfRating = IpcrfRating::updateOrCreate(
            [
                'teacher_id' => $teacherId,
                'rating_period' => $ratingPeriod,
            ],
            [
                'numerical_rating' => $averageRating,
                'total_score' => $averageRating * 20, // Convert to 100-point scale
                'status' => 'submitted',
                'created_by' => auth()->id(),
                'kra_details' => [], // Empty for now, can be populated later
                'remarks' => 'Auto-generated from submission ratings',
            ]
        );

        // The teacher's feedback survey prompt is shown on their own dashboard
        // (Teacher\DashboardController), not here, since this response goes to
        // the admin who just submitted the ratings.
        return redirect()->route('admin.ipcrf.submissions')
            ->with('success', 'All ratings submitted successfully! Average rating: ' . $averageRating . '/5');
    }

    public function storeRating(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'rating_period' => 'required|string',
            'kra_details' => 'required|array',
            'remarks' => 'nullable|string',
        ]);

        // Tier check: block a Master Teacher (admin) from rating a Master Teacher (MT tier).
        $ratee = User::find($request->teacher_id);
        if ($ratee && ! auth()->user()->canRateIpcrfTier($ratee->ipcrfTier())) {
            return back()->with('error', 'You are not allowed to rate this teacher. Master Teachers rate Teacher I-VII; the Principal rates Master Teacher I-V.');
        }

        // Calculate total score and average rating from KRA details
        $totalScore = 0;
        $totalRatings = 0;
        $objectiveCount = 0;

        foreach ($request->kra_details as $kra) {
            $totalScore += $kra['score'] ?? 0;
            
            // Sum up all objective ratings
            if (isset($kra['objectives'])) {
                foreach ($kra['objectives'] as $objective) {
                    $totalRatings += $objective['rating'] ?? 0;
                    $objectiveCount++;
                }
            }
        }

        // Calculate average rating (1-5 scale)
        $numericalRating = $objectiveCount > 0 ? $totalRatings / $objectiveCount : 0;

        $rating = IpcrfRating::create([
            'teacher_id' => $request->teacher_id,
            'rating_period' => $request->rating_period,
            'kra_details' => $request->kra_details,
            'total_score' => round($totalScore, 2),
            'numerical_rating' => round($numericalRating, 2),
            'remarks' => $request->remarks,
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'IPCRF rating created successfully!');
    }

    public function updateRating(Request $request, IpcrfRating $rating)
    {
        $request->validate([
            'kra_details' => 'required|array',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:draft,submitted,approved',
        ]);

        // Calculate total score and average rating
        $totalScore = 0;
        $totalRatings = 0;
        $objectiveCount = 0;

        foreach ($request->kra_details as $kra) {
            $totalScore += $kra['score'] ?? 0;
            
            // Sum up all objective ratings
            if (isset($kra['objectives'])) {
                foreach ($kra['objectives'] as $objective) {
                    $totalRatings += $objective['rating'] ?? 0;
                    $objectiveCount++;
                }
            }
        }

        // Calculate average rating (1-5 scale)
        $numericalRating = $objectiveCount > 0 ? $totalRatings / $objectiveCount : 0;

        $updateData = [
            'kra_details' => $request->kra_details,
            'total_score' => round($totalScore, 2),
            'numerical_rating' => round($numericalRating, 2),
            'remarks' => $request->remarks,
        ];

        if ($request->status) {
            $updateData['status'] = $request->status;
            if ($request->status === 'approved') {
                $updateData['approved_by'] = auth()->id();
                $updateData['approved_at'] = now();
            }
        }

        $rating->update($updateData);

        return back()->with('success', 'IPCRF rating updated successfully!');
    }

    public function review(Request $request, TeacherSubmission $submission)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:1000',
        ]);

        $submission->update([
            'rating' => $request->rating,
            'feedback' => $request->feedback,
            'status' => 'reviewed',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Submission reviewed successfully!');
    }

    // KRA Management
    public function storeKra(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'required|integer',
        ]);

        Kra::create($request->all());

        return back()->with('success', 'KRA created successfully!');
    }

    public function updateKra(Request $request, Kra $kra)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer|min:1',
            'position_tiers' => 'nullable|array',
            'position_tiers.*' => 'string|in:T1 - T3,T4 - T7,MT1 - MT2,MT3 - MT5',
        ], [
            'name.required' => 'KRA name is required.',
        ]);

        $kra->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $kra->description,
            'order' => $validated['order'] ?? $kra->order,
            'position_tiers' => $request->has('position_tiers')
                ? $validated['position_tiers']
                : $kra->position_tiers,
        ]);

        return back()->with('success', 'KRA updated successfully!');
    }

    /**
     * Delete a KRA. Blocked while objectives still hang off it, so a single
     * click can never take a whole branch of the IPCRF structure with it.
     */
    public function deleteKra(Kra $kra)
    {
        $objectiveCount = $kra->objectives()->count();

        if ($objectiveCount > 0) {
            return back()->with(
                'error',
                "Cannot delete \"{$kra->name}\": it still has {$objectiveCount} objective(s). Remove or move them first."
            );
        }

        $name = $kra->name;
        $kra->delete();

        return back()->with('success', "KRA \"{$name}\" deleted successfully!");
    }

    // Objective Management
    public function storeObjective(Request $request)
    {
        $request->validate([
            'kra_id' => 'required|exists:kras,id',
            'code' => 'required|string|max:50',
            'description' => 'required|string',
            'weight' => 'required|numeric|min:0|max:100',
            'order' => 'required|integer',
        ]);

        $objective = Objective::create($request->all());

        // Create competency if type is provided
        if ($request->competency_type) {
            Competency::create([
                'objective_id' => $objective->id,
                'type' => $request->competency_type,
                'weight' => $request->weight,
            ]);
        }

        return back()->with('success', 'Objective created successfully!');
    }

    public function updateObjective(Request $request, Objective $objective)
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'description' => 'required|string',
            'weight' => 'required|numeric|min:0|max:100',
            'order' => 'required|integer',
        ]);

        $objective->update($request->all());

        return back()->with('success', 'Objective updated successfully!');
    }

    public function deleteObjective(Objective $objective)
    {
        $objective->delete();
        return back()->with('success', 'Objective deleted successfully!');
    }

    /**
     * Add all default objectives from the active IPCRF configuration
     */
    public function addAllObjectives(Request $request)
    {
        try {
            // Get the active IPCRF configuration
            $activeConfig = IpcrfConfiguration::where('is_active', true)->first();
            
            if (!$activeConfig) {
                return back()->with('error', 'No active IPCRF configuration found.');
            }

            // Get all objectives that are not already added
            $selectedObjectiveIds = json_decode($activeConfig->selected_objectives, true) ?? [];
            
            if (empty($selectedObjectiveIds)) {
                return back()->with('error', 'No objectives configured in the active IPCRF configuration.');
            }

            $existingObjectiveIds = Objective::whereIn('id', $selectedObjectiveIds)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();

            if (count($existingObjectiveIds) === count($selectedObjectiveIds)) {
                return back()->with('info', 'All objectives are already active.');
            }

            // Activate all selected objectives
            Objective::whereIn('id', $selectedObjectiveIds)
                ->update(['is_active' => true]);

            $addedCount = count($selectedObjectiveIds);
            
            return back()->with('success', "Successfully activated {$addedCount} objectives!");
            
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to add all objectives: ' . $e->getMessage());
        }
    }

    /**
     * Display objectives management interface
     */
    public function objectivesIndex(Request $request)
    {
        $search = $request->input('search', '');
        $kraFilter = $request->input('kra', '');
        $statusFilter = $request->input('status', '');

        $query = Objective::with('kra');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($kraFilter) {
            $query->where('kra_id', $kraFilter);
        }

        if ($statusFilter !== '') {
            $query->where('is_active', $statusFilter === '1');
        }

        $objectives = $query->orderBy('kra_id')
                           ->orderBy('order')
                           ->get(); // Get all for AJAX requests

        $kras = Kra::orderBy('order')->get();

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'objectives' => $objectives,
                'kras' => $kras,
            ]);
        }

        // Return Inertia response for direct access (fallback)
        return Inertia::render('Admin/IpcrfConfiguration', [
            'objectives' => $objectives,
            'kras' => $kras,
            'filters' => [
                'search' => $search,
                'kra' => $kraFilter,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Store a new objective (management interface)
     */
    public function storeObjectiveManagement(Request $request)
    {
        $request->validate([
            'kra_id' => 'required|exists:kras,id',
            'code' => 'nullable|string|max:50',
            'description' => 'required|string|max:1000',
            'weight' => 'required|numeric|min:0|max:100',
            'order' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'position_tiers' => 'nullable|array',
            'position_tiers.*' => 'string|in:T1 - T3,T4 - T7,MT1 - MT2,MT3 - MT5',
        ]);

        // Use the supplied code when given, otherwise derive it from the order
        $code = $request->filled('code') ? $request->input('code') : (string) $request->order;

        $objective = Objective::create([
            'kra_id' => $request->kra_id,
            'code' => $code,
            'description' => $request->description,
            'weight' => $request->weight,
            'order' => $request->order,
            'is_active' => $request->boolean('is_active', true),
            'is_custom' => true,
            'position_tiers' => $request->position_tiers,
        ]);

        $synced = $this->syncObjectiveWithConfigurations($objective);

        return back()->with(
            'success',
            'Objective created successfully!' . $this->syncMessage($objective, $synced)
        );
    }

    /**
     * Update an existing objective (management interface)
     */
    public function updateObjectiveManagement(Request $request, Objective $objective)
    {
        $request->validate([
            'kra_id' => 'required|exists:kras,id',
            'code' => 'nullable|string|max:50',
            'description' => 'required|string|max:1000',
            'weight' => 'required|numeric|min:0|max:100',
            'order' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'position_tiers' => 'nullable|array',
            'position_tiers.*' => 'string|in:T1 - T3,T4 - T7,MT1 - MT2,MT3 - MT5',
        ]);

        // Keep a meaningful code such as a PPST reference ("1.1.2"). Only fall
        // back to the order number when the objective has no code at all.
        $code = $request->filled('code')
            ? $request->input('code')
            : ($objective->code ?: (string) $request->order);

        $objective->update([
            'kra_id' => $request->kra_id,
            'code' => $code,
            'description' => $request->description,
            'weight' => $request->weight,
            'order' => $request->order,
            'is_active' => $request->boolean('is_active'),
            'position_tiers' => $request->position_tiers,
        ]);

        $synced = $this->syncObjectiveWithConfigurations($objective->fresh());

        return back()->with(
            'success',
            'Objective updated successfully!' . $this->syncMessage($objective, $synced)
        );
    }

    /**
     * Delete an objective (management interface)
     */
    public function deleteObjectiveManagement(Objective $objective)
    {
        try {
            // Check if objective is used in any teacher submissions
            $submissionsCount = TeacherSubmission::where('objective_id', $objective->id)->count();
            
            if ($submissionsCount > 0) {
                return back()->with('error', "Cannot delete objective. It has {$submissionsCount} associated teacher submissions.");
            }

            // Drop it from any configuration that had it selected
            $this->removeObjectiveFromConfigurations($objective->id);

            $objective->delete();
            
            return back()->with('success', 'Objective deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete objective: ' . $e->getMessage());
        }
    }

    /**
     * Keep configuration selections in step with an objective's Active status.
     *
     * An objective marked Active is added to every unlocked configuration whose
     * position tier it applies to; marking it Inactive removes it again. Locked
     * configurations are never touched.
     *
     * @return int Number of configurations changed.
     */
    protected function syncObjectiveWithConfigurations(Objective $objective): int
    {
        $tiers = $objective->position_tiers ?: []; // empty means "all tiers"
        $changed = 0;

        $configurations = IpcrfConfiguration::where('is_locked', false)->get();

        foreach ($configurations as $configuration) {
            // Skip configurations for a tier this objective does not apply to
            if (!empty($tiers) && $configuration->position_tier
                && !in_array($configuration->position_tier, $tiers, true)) {
                continue;
            }

            $selected = array_map('intval', $configuration->selected_objective_ids ?? []);
            $alreadySelected = in_array($objective->id, $selected, true);

            if ($objective->is_active && !$alreadySelected) {
                $selected[] = $objective->id;
            } elseif (!$objective->is_active && $alreadySelected) {
                $selected = array_filter($selected, fn ($id) => $id !== $objective->id);
            } else {
                continue; // Already in the right state
            }

            $configuration->update([
                'selected_objective_ids' => array_values(array_unique($selected)),
            ]);

            $changed++;
        }

        return $changed;
    }

    /**
     * Remove an objective id from every configuration that selected it.
     */
    protected function removeObjectiveFromConfigurations(int $objectiveId): void
    {
        foreach (IpcrfConfiguration::all() as $configuration) {
            $selected = array_map('intval', $configuration->selected_objective_ids ?? []);

            if (!in_array($objectiveId, $selected, true)) {
                continue;
            }

            $configuration->update([
                'selected_objective_ids' => array_values(
                    array_filter($selected, fn ($id) => $id !== $objectiveId)
                ),
            ]);
        }
    }

    /**
     * Human readable note about what the sync did.
     */
    protected function syncMessage(Objective $objective, int $changed): string
    {
        if ($changed === 0) {
            return '';
        }

        $word = $changed === 1 ? 'configuration' : 'configurations';

        return $objective->is_active
            ? " Selected in {$changed} {$word}."
            : " Removed from {$changed} {$word}.";
    }
}
