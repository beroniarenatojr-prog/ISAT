<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Competency extends Model
{
    use HasFactory;

    protected $fillable = [
        'objective_id',
        'type',
        'description',
        'weight',
    ];

    protected $casts = [
        'weight' => 'decimal:3',
    ];

    public function objective()
    {
        return $this->belongsTo(Objective::class);
    }

    public function submissions()
    {
        return $this->hasMany(TeacherSubmission::class);
    }
}
