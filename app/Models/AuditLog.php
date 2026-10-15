<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the action color based on type
     */
    public function getActionColorAttribute(): string
    {
        return match($this->action) {
            'create' => 'green',
            'update' => 'yellow',
            'delete' => 'red',
            'promote' => 'blue',
            'login' => 'purple',
            default => 'gray',
        };
    }

    /**
     * Get the action icon based on type
     */
    public function getActionIconAttribute(): string
    {
        return match($this->action) {
            'create' => 'plus',
            'update' => 'edit',
            'delete' => 'trash',
            'promote' => 'trending-up',
            'login' => 'log-in',
            default => 'activity',
        };
    }
}
