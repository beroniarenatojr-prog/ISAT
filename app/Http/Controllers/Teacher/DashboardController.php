<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\IpcrfConfiguration;
use App\Models\TeacherSubmission;
use App\Models\SignedIpcrf;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $teacherId = auth()->id();
        
        // Get active configuration
        $activeConfig = IpcrfConfiguration::where('is_active', true)->first();
        
        // Get current year submissions
        $submissions = [];
        $signedIpcrf = null;
        
        if ($activeConfig) {
            $submissions = TeacherSubmission::where('teacher_id', $teacherId)
                ->where('school_year', $activeConfig->school_year)
                ->get();
                
            $signedIpcrf = SignedIpcrf::where('teacher_id', $teacherId)
                ->where('school_year', $activeConfig->school_year)
                ->first();
        }
        
        // Load user with position relationship
        $user = auth()->user()->load('currentPosition');
        
        // Parse division JSON to get position info
        $divisionData = json_decode($user->division, true);
        if (is_array($divisionData)) {
            $user->position_range = $divisionData['position_range'] ?? null;
            $user->position_career_stage = $divisionData['career_stage'] ?? null;
            $user->department = $divisionData['department'] ?? null;
        }

        return Inertia::render('Teacher/Dashboard', [
            'user' => $user,
            'activeConfig' => $activeConfig,
            'submissions' => $submissions,
            'signedIpcrf' => $signedIpcrf,
        ]);
    }
}
