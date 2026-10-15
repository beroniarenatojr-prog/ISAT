<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SignedIpcrf;
use App\Models\IpcrfConfiguration;
use App\Models\TeacherQuestionnaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SignedIpcrfController extends Controller
{
    public function index()
    {
        $signedIpcrfs = SignedIpcrf::where('teacher_id', auth()->id())
            ->with('reviewer')
            ->orderBy('created_at', 'desc')
            ->get();

        $activeConfig = IpcrfConfiguration::where('is_active', true)->first();

        $outstandingSurveys = $activeConfig
            ? $this->outstandingSurveys($activeConfig->school_year)
            : [];

        return Inertia::render('Teacher/SignedIpcrf', [
            'signedIpcrfs' => $signedIpcrfs,
            'activeConfig' => $activeConfig,
            'user' => auth()->user(),
            'outstandingSurveys' => $outstandingSurveys,
            'surveysComplete' => empty($outstandingSurveys),
        ]);
    }

    /**
     * Surveys the teacher must finish before a signed IPCRF can be submitted
     * for the given school year. Returns the outstanding items only, so an
     * empty array means every required survey is done.
     *
     * @return array<int, array{key: string, label: string, route: string, status: string}>
     */
    private function outstandingSurveys(string $schoolYear): array
    {
        $outstanding = [];

        $questionnaire = TeacherQuestionnaire::where('teacher_id', auth()->id())
            ->where('school_year', $schoolYear)
            ->first();

        if (! $questionnaire || $questionnaire->status !== 'submitted') {
            $outstanding[] = [
                'key' => 'questionnaire',
                'label' => 'IPCRF Questionnaire (Self-Assessment)',
                'route' => route('teacher.questionnaire'),
                'status' => $questionnaire ? 'Saved as draft — not yet submitted' : 'Not started',
            ];
        }

        return $outstanding;
    }

    public function store(Request $request)
    {
        // Check if there's an active config
        $activeConfig = IpcrfConfiguration::where('is_active', true)->first();
        
        if (!$activeConfig) {
            return back()->with('error', 'No active IPCRF configuration found.');
        }

        if ($activeConfig->is_locked) {
            return back()->with('error', 'The IPCRF for this school year is currently locked.');
        }

        // Check if already submitted for this school year
        $existingSubmission = SignedIpcrf::where('teacher_id', auth()->id())
            ->where('school_year', $activeConfig->school_year)
            ->whereIn('status', ['submitted', 'approved'])
            ->first();

        if ($existingSubmission) {
            return back()->with('error', 'You have already submitted a signed IPCRF for SY ' . $activeConfig->school_year);
        }

        // Block submission until every required survey for this school year is done
        $outstandingSurveys = $this->outstandingSurveys($activeConfig->school_year);

        if (! empty($outstandingSurveys)) {
            $labels = implode(', ', array_column($outstandingSurveys, 'label'));

            return back()->with('error', 'Please complete all required surveys before submitting your signed IPCRF. Outstanding: ' . $labels . '.');
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480', // 20MB max
            'notes' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('file');
        $path = $file->store('signed-ipcrfs/' . auth()->id(), 'public');

        SignedIpcrf::create([
            'teacher_id' => auth()->id(),
            'school_year' => $activeConfig->school_year,
            'file_path' => $path,
            'notes' => $request->notes,
            'status' => 'submitted',
        ]);

        return back()->with('success', 'Signed IPCRF submitted successfully!');
    }

    public function destroy(SignedIpcrf $signedIpcrf)
    {
        // Only allow deletion if it's the teacher's own submission and not yet reviewed
        if ($signedIpcrf->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        if ($signedIpcrf->status !== 'submitted') {
            return back()->with('error', 'Cannot delete a reviewed submission.');
        }

        // Delete file from storage
        if ($signedIpcrf->file_path) {
            Storage::disk('public')->delete($signedIpcrf->file_path);
        }

        $signedIpcrf->delete();

        return back()->with('success', 'Signed IPCRF removed successfully!');
    }
}
