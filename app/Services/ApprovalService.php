<?php

namespace App\Services;

use App\Models\PendingAction;
use Illuminate\Support\Facades\Auth;

class ApprovalService
{
    /**
     * Create a pending action that requires super admin approval
     */
    public function createPendingAction(string $actionType, string $modelType, ?int $modelId, array $data): PendingAction
    {
        return PendingAction::create([
            'user_id' => Auth::id(),
            'action_type' => $actionType,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'data' => $data,
            'status' => 'pending',
        ]);
    }

    /**
     * Approve a pending action and execute it
     */
    public function approve(PendingAction $pendingAction): bool
    {
        if (!Auth::user()->isSuperAdmin()) {
            return false;
        }

        $pendingAction->update([
            'status' => 'approved',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        // Execute the action
        return $this->executeAction($pendingAction);
    }

    /**
     * Reject a pending action
     */
    public function reject(PendingAction $pendingAction, string $reason = null): bool
    {
        if (!Auth::user()->isSuperAdmin()) {
            return false;
        }

        $pendingAction->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return true;
    }

    /**
     * Execute the approved action
     */
    protected function executeAction(PendingAction $pendingAction): bool
    {
        $modelClass = $pendingAction->model_type;
        $data = $pendingAction->data;

        try {
            switch ($pendingAction->action_type) {
                case 'create':
                    $modelClass::create($data);
                    break;

                case 'update':
                    $model = $modelClass::findOrFail($pendingAction->model_id);
                    $model->update($data);
                    break;

                case 'delete':
                    $model = $modelClass::findOrFail($pendingAction->model_id);
                    $model->delete();
                    break;

                default:
                    return false;
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to execute pending action: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user needs approval for actions
     */
    public function needsApproval(): bool
    {
        return Auth::check() && Auth::user()->hasRole('admin');
    }
}
