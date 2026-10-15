<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kra extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'order',
        'is_active',
        'position_tiers',
        'ipcrf_configuration_id',
        'is_custom',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_custom' => 'boolean',
        'position_tiers' => 'array',
    ];

    public function objectives()
    {
        return $this->hasMany(Objective::class)->orderBy('order');
    }

    public function selfRatings()
    {
        return $this->hasMany(KraSelfRating::class);
    }

    /**
     * Scope to filter KRAs by position tier
     */
    public function scopeForPositionTier($query, $positionTier)
    {
        return $query->where(function ($q) use ($positionTier) {
            $q->whereNull('position_tiers')
              ->orWhereJsonContains('position_tiers', $positionTier);
        });
    }
}
