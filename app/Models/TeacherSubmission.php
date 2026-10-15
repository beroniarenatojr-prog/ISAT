<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'objective_id',
        'competency_id',
        'file_path',
        'notes',
        'rating',
        'status',
        'reviewed_by',
        'reviewed_at',
        'feedback',
        'school_year',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function objective()
    {
        return $this->belongsTo(Objective::class);
    }

    public function competency()
    {
        return $this->belongsTo(Competency::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
