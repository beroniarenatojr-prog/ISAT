<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IpcrfRating extends Model
{
    protected $fillable = [
        'teacher_id',
        'rating_period',
        'school_year',
        'numerical_rating',
        'performance_level',
        'status',
        'kra_details',
        'total_score',
        'remarks',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'kra_details' => 'array',
        'numerical_rating' => 'decimal:2',
        'total_score' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function survey()
    {
        return $this->hasOne(IpcrfSurvey::class, 'ipcrf_rating_id');
    }

    /**
     * Calculate performance level based on numerical rating
     * Based on DEPED IPCRF rating scale
     */
    public function calculatePerformanceLevel(): string
    {
        if ($this->numerical_rating === null) {
            return 'Not Rated';
        }

        $rating = $this->numerical_rating;

        if ($rating >= 4.500 && $rating <= 5.000) {
            return 'Outstanding';
        } elseif ($rating >= 3.500 && $rating <= 4.499) {
            return 'Very Satisfactory';
        } elseif ($rating >= 2.500 && $rating <= 3.499) {
            return 'Satisfactory';
        } elseif ($rating >= 1.500 && $rating <= 2.499) {
            return 'Unsatisfactory';
        } else {
            return 'Poor';
        }
    }

    /**
     * Automatically update performance level when numerical rating changes
     */
    protected static function booted(): void
    {
        static::saving(function (IpcrfRating $rating) {
            if ($rating->isDirty('numerical_rating')) {
                $rating->performance_level = $rating->calculatePerformanceLevel();
            }
            
            // Auto-populate school_year from rating_period if not set
            if (empty($rating->school_year) && !empty($rating->rating_period)) {
                $rating->school_year = $rating->rating_period;
            }
        });
    }
}
