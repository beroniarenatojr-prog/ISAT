<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'current_position_id',
        'division',
        'teacher_type',
        'employee_id',
        'career_stage',
        'gender',
        'teacher_status',
        'department',
        'school_campus',
        'level',
        'date_hired',
        'years_of_service',
        'contact_number',
        'address',
        'profile_picture',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_hired' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    /**
     * Human-facing label for this account's role.
     * The spatie role keys stay as-is; only the wording changes.
     *   super-admin -> Principal (or the division position_title, e.g. "Administrator")
     *   admin       -> Master Teacher
     *   teacher     -> Teacher
     */
    public function roleLabel(): string
    {
        if ($this->hasRole('super-admin')) {
            // A dual-role account (super-admin + teacher, e.g. the Administrator)
            // is labelled by its division position_title rather than "Principal".
            if ($this->isAdministrator()) {
                return $this->administratorTitle() ?? 'Administrator';
            }

            return 'Principal';
        }
        if ($this->hasRole('admin')) {
            return 'Master Teacher';
        }
        if ($this->hasRole('teacher')) {
            return 'Teacher';
        }

        return 'User';
    }

    /**
     * The Administrator: a dual-role super-admin + teacher whose division
     * position_title is something other than the principalship (e.g.
     * "Administrator"). This account may manage assessment tools and is the
     * only account allowed to create Principal accounts.
     */
    public function isAdministrator(): bool
    {
        return $this->hasRole('super-admin')
            && $this->hasRole('teacher')
            && $this->administratorTitle() !== null;
    }

    /** The non-principal position_title for a dual-role super-admin, else null. */
    private function administratorTitle(): ?string
    {
        if (! $this->hasRole('super-admin') || ! $this->hasRole('teacher')) {
            return null;
        }

        $division = json_decode((string) $this->division, true);
        $title = is_array($division) ? ($division['position_title'] ?? null) : null;

        return ($title && ! str_contains($title, 'Principal')) ? $title : null;
    }

    /**
     * Which IPCRF rating tier this teacher belongs to, read from the
     * position_range stored in the division JSON.
     *   "MT1 - MT2" -> master_teacher
     *   anything else -> teacher
     */
    public function ipcrfTier(): string
    {
        $division = json_decode($this->division, true);
        $range = is_array($division) ? ($division['position_range'] ?? '') : '';

        return str_starts_with((string) $range, 'MT') ? 'master_teacher' : 'teacher';
    }

    /**
     * Can this account rate a teacher who sits in the given tier?
     *   Principal (super-admin) oversees every tier.
     *   Master Teacher (admin)  rates the Teacher I-VII tier (any non-MT tier).
     */
    public function canRateIpcrfTier(string $tier): bool
    {
        if ($this->hasRole('super-admin')) {
            return true;
        }
        if ($this->hasRole('admin')) {
            return $tier === 'teacher';
        }

        return false;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    public function isAnyAdmin(): bool
    {
        return $this->hasAnyRole(['admin', 'super-admin']);
    }

    public function teacherSubmissions()
    {
        return $this->hasMany(TeacherSubmission::class, 'teacher_id');
    }

    /**
     * Get IPCRF ratings for this teacher
     */
    public function ipcrfRatings()
    {
        return $this->hasMany(IpcrfRating::class, 'teacher_id');
    }

    /**
     * Get the current position of the teacher
     */
    public function currentPosition()
    {
        return $this->belongsTo(Position::class, 'current_position_id');
    }

    /**
     * Get all promotions for this user
     */
    public function promotions()
    {
        return $this->hasMany(Promotion::class, 'user_id');
    }

    /**
     * Get promotions this user has approved
     */
    public function approvedPromotions()
    {
        return $this->hasMany(Promotion::class, 'promoted_by');
    }
}
