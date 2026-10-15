<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an action
     */
    public static function log(
        string $action,
        string $description,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log teacher creation
     */
    public static function logTeacherCreated(int $teacherId, string $teacherName): void
    {
        self::log(
            'create',
            "Created teacher: {$teacherName}",
            'User',
            $teacherId
        );
    }

    /**
     * Log teacher update
     */
    public static function logTeacherUpdated(int $teacherId, string $teacherName, array $oldValues, array $newValues): void
    {
        self::log(
            'update',
            "Updated teacher: {$teacherName}",
            'User',
            $teacherId,
            $oldValues,
            $newValues
        );
    }

    /**
     * Log teacher deletion
     */
    public static function logTeacherDeleted(int $teacherId, string $teacherName): void
    {
        self::log(
            'delete',
            "Deleted teacher: {$teacherName}",
            'User',
            $teacherId
        );
    }

    /**
     * Log teacher promotion
     */
    public static function logTeacherPromoted(int $teacherId, string $teacherName, string $fromPosition, string $toPosition): void
    {
        self::log(
            'promote',
            "Promoted teacher {$teacherName} from {$fromPosition} to {$toPosition}",
            'User',
            $teacherId,
            ['position' => $fromPosition],
            ['position' => $toPosition]
        );
    }
}
