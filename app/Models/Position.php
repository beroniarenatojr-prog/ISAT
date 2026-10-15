<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parent_position_id',
        'order',
    ];

    /**
     * Get the parent position (for hierarchy)
     */
    public function parentPosition()
    {
        return $this->belongsTo(Position::class, 'parent_position_id');
    }

    /**
     * Get child positions
     */
    public function childPositions()
    {
        return $this->hasMany(Position::class, 'parent_position_id');
    }

    /**
     * Get users with this position
     */
    public function users()
    {
        return $this->hasMany(User::class, 'current_position_id');
    }

    /**
     * Get the next position in hierarchy
     */
    public function nextPosition()
    {
        return Position::where('order', $this->order + 1)->first();
    }

    /**
     * Check if this is the highest position
     */
    public function isMaxPosition(): bool
    {
        return $this->order === Position::max('order');
    }
}
