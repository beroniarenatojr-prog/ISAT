<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SignedIpcrf extends Model
{
    protected $table = 'signed_ipcrfs';
    
    protected $fillable = [
        'teacher_id',
        'school_year',
        'file_path',
        'notes',
        'status',
        'admin_remarks',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
