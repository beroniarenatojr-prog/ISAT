<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IpcrfSurvey;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    public function index(Request $request)
    {
        $query = IpcrfSurvey::with(['teacher', 'ipcrfRating'])
            ->orderBy('created_at', 'desc');

        // Filter by school year if provided
        if ($request->school_year) {
            $query->where('school_year', $request->school_year);
        }

        // Get all surveys without pagination
        $surveys = $query->get();

        // Get all unique school years
        $schoolYears = IpcrfSurvey::select('school_year')
            ->distinct()
            ->orderBy('school_year', 'desc')    
            ->pluck('school_year');

        // Calculate statistics
        $stats = [
            'total_responses' => IpcrfSurvey::when($request->school_year, function($q) use ($request) {
                return $q->where('school_year', $request->school_year);
            })->count(),
            
            'average_satisfaction' => IpcrfSurvey::when($request->school_year, function($q) use ($request) {
                return $q->where('school_year', $request->school_year);
            })->avg('overall_satisfaction'),
            
            'satisfaction_distribution' => IpcrfSurvey::when($request->school_year, function($q) use ($request) {
                return $q->where('school_year', $request->school_year);
            })->selectRaw('overall_satisfaction, COUNT(*) as count')
                ->groupBy('overall_satisfaction')
                ->pluck('count', 'overall_satisfaction')
                ->toArray(),
            
            'average_responses' => $this->calculateAverageResponses($request->school_year),
        ];

        return Inertia::render('Admin/SurveyResults', [
            'surveys' => $surveys,
            'schoolYears' => $schoolYears,
            'filters' => ['school_year' => $request->school_year],
            'stats' => $stats,
        ]);
    }

    private function calculateAverageResponses($schoolYear = null)
    {
        $surveys = IpcrfSurvey::when($schoolYear, function($q) use ($schoolYear) {
            return $q->where('school_year', $schoolYear);
        })->get();

        if ($surveys->isEmpty()) {
            return [];
        }

        $totals = [
            'process_clarity' => 0,
            'submission_ease' => 0,
            'admin_feedback' => 0,
            'objectives_clarity' => 0,
            'system_usability' => 0,
        ];

        foreach ($surveys as $survey) {
            $responses = $survey->responses;
            foreach ($totals as $key => $value) {
                if (isset($responses[$key])) {
                    $totals[$key] += $responses[$key];
                }
            }
        }

        $count = $surveys->count();
        $averages = [];
        foreach ($totals as $key => $total) {
            $averages[$key] = $count > 0 ? round($total / $count, 2) : 0;
        }

        return $averages;
    }
}
