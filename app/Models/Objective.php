<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Objective extends Model
{
    use HasFactory;

    protected $fillable = [
        'kra_id',
        'code',
        'description',
        'order',
        'weight',
        'is_active',
        'position_tiers',
        'ipcrf_configuration_id',
        'is_custom',
    ];

    protected $casts = [
        'weight' => 'decimal:3',
        'is_active' => 'boolean',
        'is_custom' => 'boolean',
        'position_tiers' => 'array',
    ];

    public function kra()
    {
        return $this->belongsTo(Kra::class);
    }

    public function competencies()
    {
        return $this->hasMany(Competency::class);
    }

    public function submissions()
    {
        return $this->hasMany(TeacherSubmission::class);
    }

    /**
     * Scope to filter Objectives by position tier
     */
    public function scopeForPositionTier($query, $positionTier)
    {
        return $query->where(function ($q) use ($positionTier) {
            $q->whereNull('position_tiers')
              ->orWhereJsonContains('position_tiers', $positionTier);
        });
    }
}
