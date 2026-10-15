<?php

namespace App\Traits;

use App\Models\PendingAction;
use Illuminate\Support\Facades\Auth;

trait RequiresApproval
{
    /**
     * Create a record with approval if user is admin
     */
    public static function createWithApproval(array $data)
    {
        if (Auth::user()->hasRole('admin')) {
            // Create pending action for super admin approval
            return PendingAction::create([
                'user_id' => Auth::id(),
                'action_type' => 'create',
                'model_type' => static::class,
                'model_id' => null,
                'data' => $data,
                'status' => 'pending',
            ]);
        }

        // Super admin can create directly
        return static::create($data);
    }

    /**
     * Update a record with approval if user is admin
     */
    public function updateWithApproval(array $data)
    {
        if (Auth::user()->hasRole('admin')) {
            // Create pending action for super admin approval
            return PendingAction::create([
                'user_id' => Auth::id(),
                'action_type' => 'update',
                'model_type' => static::class,
                'model_id' => $this->id,
                'data' => $data,
                'status' => 'pending',
            ]);
        }

        // Super admin can update directly
        return $this->update($data);
    }

    /**
     * Delete a record with approval if user is admin
     */
    public function deleteWithApproval()
    {
        if (Auth::user()->hasRole('admin')) {
            // Create pending action for super admin approval
            return PendingAction::create([
                'user_id' => Auth::id(),
                'action_type' => 'delete',
                'model_type' => static::class,
                'model_id' => $this->id,
                'data' => [],
                'status' => 'pending',
            ]);
        }

        // Super admin can delete directly
        return $this->delete();
    }
}
