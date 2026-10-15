<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PendingAction;
use App\Services\ApprovalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PendingActionController extends Controller
{
    protected $approvalService;

    public function __construct(ApprovalService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    /**
     * Display pending actions (Super Admin only)
     */
    public function index()
    {
        $pendingActions = PendingAction::with(['user', 'reviewer'])
            ->pending()
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/PendingActions', [
            'pendingActions' => $pendingActions,
        ]);
    }

    /**
     * Approve a pending action (Super Admin only)
     */
    public function approve(PendingAction $pendingAction)
    {
        if ($this->approvalService->approve($pendingAction)) {
            return back()->with('success', 'Action approved and executed successfully.');
        }

        return back()->with('error', 'Failed to approve action.');
    }

    /**
     * Reject a pending action (Super Admin only)
     */
    public function reject(Request $request, PendingAction $pendingAction)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        if ($this->approvalService->reject($pendingAction, $request->reason)) {
            return back()->with('success', 'Action rejected successfully.');
        }

        return back()->with('error', 'Failed to reject action.');
    }

    /**
     * View my pending actions (for regular admins)
     */
    public function myActions()
    {
        $myActions = PendingAction::with('reviewer')
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/MyPendingActions', [
            'myActions' => $myActions,
        ]);
    }
}
