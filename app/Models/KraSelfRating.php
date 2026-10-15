<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KraSelfRating extends Model
{
    use HasFactory;

    /**
     * Default share of the overall 100% carried by the self-rating component;
     * the objectives carry the rest. The Administrator can override this from
     * the Assessment Tools page (self_rating_settings table).
     */
    public const DEFAULT_TOTAL_WEIGHT = 5.00;

    /** Backwards-compatible alias for the default weight. */
    public const TOTAL_WEIGHT = self::DEFAULT_TOTAL_WEIGHT;

    /** Configured total self-rating weight (falls back to the default). */
    public static function totalWeight(): float
    {
        return (float) \App\Models\SelfRatingSetting::current()->total_weight;
    }

    /** Whether teachers should see the KRA self-rating upload at all. */
    public static function isActive(): bool
    {
        return (bool) \App\Models\SelfRatingSetting::current()->is_active;
    }

    /**
     * Weight assigned to a single KRA's self-rating (total split evenly across
     * the KRAs, since each KRA gets its own upload).
     */
    public static function weightPerKra(int $kraCount): float
    {
        return $kraCount > 0 ? round(self::totalWeight() / $kraCount, 3) : 0.0;
    }

    protected $fillable = [
        'teacher_id',
        'kra_id',
        'school_year',
        'file_path',
        'original_name',
        'self_rating',
        'notes',
    ];

    protected $casts = [
        'self_rating' => 'decimal:2',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function kra()
    {
        return $this->belongsTo(Kra::class);
    }
}
