<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SignedIpcrf;
use App\Models\IpcrfConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SignedIpcrfController extends Controller
{
    public function index(Request $request)
    {
        $query = SignedIpcrf::with(['teacher', 'reviewer'])
            ->orderBy('created_at', 'desc');

        // Filter by school year if provided
        if ($request->school_year) {
            $query->where('school_year', $request->school_year);
        }

        // Filter by status if provided
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $signedIpcrfs = $query->paginate(15);

        // Get all unique school years for filter
        $schoolYears = SignedIpcrf::select('school_year')
            ->distinct()
            ->orderBy('school_year', 'desc')
            ->pluck('school_year');

        return Inertia::render('Admin/SignedIpcrfList', [
            'signedIpcrfs' => $signedIpcrfs,
            'schoolYears' => $schoolYears,
            'filters' => $request->only(['school_year', 'status']),
        ]);
    }

    public function review(Request $request, SignedIpcrf $signedIpcrf)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string|max:1000',
        ]);

        $signedIpcrf->update([
            'status' => $request->status,
            'admin_remarks' => $request->admin_remarks,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Signed IPCRF ' . $request->status . ' successfully!');
    }

    public function download(SignedIpcrf $signedIpcrf)
    {
        if (!Storage::disk('public')->exists($signedIpcrf->file_path)) {
            return back()->with('error', 'File not found.');
        }

        return Storage::disk('public')->download($signedIpcrf->file_path);
    }
}
