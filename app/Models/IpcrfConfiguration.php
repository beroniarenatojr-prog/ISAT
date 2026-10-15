<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpcrfConfiguration extends Model
{
    /**
     * Position tiers a configuration can target.
     */
    public const POSITION_TIERS = [
        'T1 - T3',
        'T4 - T7',
        'MT1 - MT2',
        'MT3 - MT5',
    ];

    protected $fillable = [
        'school_year',
        'position_tier',
        'kra_count',
        'objectives_per_kra',
        'selected_objective_ids',
        'submission_start_date',
        'submission_end_date',
        'is_active',
        'is_locked',
        'notes',
    ];

    protected $casts = [
        'objectives_per_kra' => 'array',
        'selected_objective_ids' => 'array',
        'submission_start_date' => 'date',
        'submission_end_date' => 'date',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Get custom KRAs for this configuration
     */
    public function customKras()
    {
        return $this->hasMany(\App\Models\Kra::class, 'ipcrf_configuration_id');
    }

    /**
     * Get custom objectives for this configuration
     */
    public function customObjectives()
    {
        return $this->hasMany(\App\Models\Objective::class, 'ipcrf_configuration_id');
    }

    /**
     * Get the active configuration for a school year
     */
    public static function getActiveConfig($schoolYear = null)
    {
        if ($schoolYear) {
            return self::where('school_year', $schoolYear)->first();
        }
        
        return self::where('is_active', true)->first();
    }

    /**
     * Get the active configuration that applies to a given position tier.
     * Falls back to a tier-agnostic configuration (position_tier = null) when
     * no tier-specific configuration is active.
     */
    public static function getActiveConfigForTier(?string $positionTier)
    {
        if ($positionTier) {
            $tierConfig = self::where('is_active', true)
                ->where('position_tier', $positionTier)
                ->first();

            if ($tierConfig) {
                return $tierConfig;
            }
        }

        return self::where('is_active', true)
            ->whereNull('position_tier')
            ->first();
    }

    /**
     * Check if configuration can be modified
     */
    public function canModify(): bool
    {
        return !$this->is_locked;
    }

    /**
     * Lock configuration to prevent changes
     */
    public function lock(): void
    {
        $this->update(['is_locked' => true]);
    }

    /**
     * Unlock configuration
     */
    public function unlock(): void
    {
        $this->update(['is_locked' => false]);
    }
}
