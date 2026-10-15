<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\IpcrfSurvey;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    public function store(Request $request)
    {
        \Log::info('Survey submission attempt', [
            'teacher_id' => auth()->id(),
            'data' => $request->all()
        ]);

        $request->validate([
            'ipcrf_rating_id' => 'required|exists:ipcrf_ratings,id',
            'school_year' => 'required|string',
            'responses' => 'required|array',
            'overall_satisfaction' => 'required|integer|min:1|max:5',
            'comments' => 'nullable|string|max:2000',
        ]);

        // Check if survey already exists for this rating
        $existingSurvey = IpcrfSurvey::where('teacher_id', auth()->id())
            ->where('ipcrf_rating_id', $request->ipcrf_rating_id)
            ->first();

        if ($existingSurvey) {
            \Log::warning('Duplicate survey submission attempt');
            return back()->with('error', 'You have already submitted a survey for this rating.');
        }

        $survey = IpcrfSurvey::create([
            'teacher_id' => auth()->id(),
            'ipcrf_rating_id' => $request->ipcrf_rating_id,
            'school_year' => $request->school_year,
            'responses' => $request->responses,
            'overall_satisfaction' => $request->overall_satisfaction,
            'comments' => $request->comments,
        ]);

        \Log::info('Survey created successfully', ['survey_id' => $survey->id]);

        return back()->with('success', 'Thank you for your feedback!');
    }
}
