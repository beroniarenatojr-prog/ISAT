<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShsQuestionnaireResponse extends Model
{
    protected $fillable = [
        'teacher_id',
        'questionnaire_template_id',
        'school_year',
        'profile',
        'trainings',
        'performance_ratings',
        'challenge_ratings',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'profile' => 'array',
        'trainings' => 'array',
        'performance_ratings' => 'array',
        'challenge_ratings' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function template()
    {
        return $this->belongsTo(QuestionnaireTemplate::class, 'questionnaire_template_id');
    }
}
