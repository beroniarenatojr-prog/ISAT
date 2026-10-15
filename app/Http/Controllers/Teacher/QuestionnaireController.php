<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\IpcrfConfiguration;
use App\Models\Objective;
use App\Models\TeacherQuestionnaire;
use App\Models\TeacherSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionnaireController extends Controller
{
    /**
     * Number of objectives in the teacher's active IPCRF configuration (for
     * their position tier) that they have NOT yet uploaded a MOV for. Mirrors
     * Teacher/IpcrfController's objective scoping so both pages agree on what
     * "every objective" means. Zero means nothing is missing (or there's no
     * active config to check against).
     */
    private function missingMovCount(): int
    {
        $user = auth()->user();
        $divisionData = json_decode($user->division, true);
        $teacherPositionTier = is_array($divisionData) ? ($divisionData['position_range'] ?? null) : null;

        $activeConfig = IpcrfConfiguration::getActiveConfigForTier($teacherPositionTier);
        if (!$activeConfig) {
            return 0;
        }

        $selectedObjectiveIds = $activeConfig->selected_objective_ids ?? [];

        $requiredObjectiveIds = Objective::where('is_active', true)
            ->where(function ($q) use ($selectedObjectiveIds, $activeConfig) {
                $q->whereIn('id', $selectedObjectiveIds)
                  ->orWhere('ipcrf_configuration_id', $activeConfig->id);
            })
            ->pluck('id');

        if ($requiredObjectiveIds->isEmpty()) {
            return 0;
        }

        $uploadedObjectiveIds = TeacherSubmission::where('teacher_id', $user->id)
            ->where('school_year', $activeConfig->school_year)
            ->whereIn('objective_id', $requiredObjectiveIds)
            ->distinct()
            ->pluck('objective_id');

        return $requiredObjectiveIds->diff($uploadedObjectiveIds)->count();
    }

    public function index()
    {
        // Gate: a teacher must upload a MOV for every objective before taking the survey
        $missingCount = $this->missingMovCount();
        if ($missingCount > 0) {
            return redirect()->route('teacher.ipcrf')
                ->with('error', "Please upload your MOVs for all objectives first. {$missingCount} objective(s) still need a MOV before you can take the survey.");
        }

        // Get active IPCRF configuration
        $activeConfig = \App\Models\IpcrfConfiguration::where('is_active', true)->first();

        $schoolYear = $activeConfig ? $activeConfig->school_year : '2024-2025';

        // Get or create questionnaire for current year
        $questionnaire = TeacherQuestionnaire::firstOrCreate(
            [
                'teacher_id' => auth()->id(),
                'school_year' => $schoolYear,
            ],
            [
                'status' => 'draft',
            ]
        );

        // Questions + scale come from the editable "flat" template when present;
        // Teacher/Questionnaire.jsx falls back to its built-in list otherwise.
        $template = \App\Models\QuestionnaireTemplate::where('key', \Database\Seeders\EtracesSurveySeeder::KEY)
            ->where('is_active', true)
            ->first();

        return Inertia::render('Teacher/Questionnaire', [
            'questionnaire' => $questionnaire,
            'schoolYear' => $schoolYear,
            'user' => auth()->user(),
            'template' => $template,
        ]);
    }

    public function store(Request $request)
    {
        // Gate: block direct API submissions too, not just the button in the UI
        $missingCount = $this->missingMovCount();
        if ($missingCount > 0) {
            return back()->with('error', "Please upload your MOVs for all objectives first. {$missingCount} objective(s) still need a MOV before you can take the survey.");
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'sex' => 'nullable|string|max:50',
            'years_of_service' => 'nullable|string|max:50',
            'last_ipcr_rating' => 'nullable|string|max:50',
            'responses' => 'required|array',
            'school_year' => 'nullable|string',
            'status' => 'required|in:draft,submitted',
        ]);

        // Get the school year from request or active configuration
        $schoolYear = $request->school_year;
        if (!$schoolYear) {
            $activeConfig = \App\Models\IpcrfConfiguration::where('is_active', true)->first();
            $schoolYear = $activeConfig ? $activeConfig->school_year : '2024-2025';
        }

        $questionnaire = TeacherQuestionnaire::updateOrCreate(
            [
                'teacher_id' => auth()->id(),
                'school_year' => $schoolYear,
            ],
            [
                'name' => $request->name,
                'sex' => $request->sex,
                'years_of_service' => $request->years_of_service,
                'last_ipcr_rating' => $request->last_ipcr_rating,
                'responses' => $request->responses,
                'status' => $request->status,
                'submitted_at' => $request->status === 'submitted' ? now() : null,
            ]
        );

        return back()->with('success', $request->status === 'submitted' 
            ? 'Thank you! Your feedback has been submitted successfully.' 
            : 'Draft saved successfully!');
    }
}
