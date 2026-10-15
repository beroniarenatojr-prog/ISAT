<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherQuestionnaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'school_year',
        'name',
        'sex',
        'age',
        'teaching_position',
        'years_of_service',
        'last_ipcr_rating',
        'bachelors_degree',
        'year_level_assignment',
        'subject_taught',
        'trainings_attended',
        'kra_ratings',
        'challenges',
        'responses',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'kra_ratings' => 'array',
        'challenges' => 'array',
        'responses' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
