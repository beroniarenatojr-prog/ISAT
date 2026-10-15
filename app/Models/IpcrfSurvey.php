<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpcrfSurvey extends Model
{
    protected $fillable = [
        'teacher_id',
        'ipcrf_rating_id',
        'school_year',
        'responses',
        'comments',
        'overall_satisfaction',
    ];

    protected $casts = [
        'responses' => 'array',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function ipcrfRating()
    {
        return $this->belongsTo(IpcrfRating::class, 'ipcrf_rating_id');
    }
}
