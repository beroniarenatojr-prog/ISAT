<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SelfRatingSetting extends Model
{
    protected $fillable = [
        'total_weight',
        'is_active',
    ];

    protected $casts = [
        'total_weight' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /** The single settings row, created with defaults if missing. */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'total_weight' => KraSelfRating::DEFAULT_TOTAL_WEIGHT,
            'is_active' => true,
        ]);
    }
}
