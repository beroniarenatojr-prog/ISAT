<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the teacher self-registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming teacher self-registration request. The account is
     * created inactive - an admin must approve it (Teacher Management) before
     * it can log in, same gate as the pre-existing is_active toggle.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'current_position_id' => 'required|string|in:T1 - T3,T4 - T7,MT1 - MT2,MT3 - MT5',
            'career_stage' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'teacher_status' => 'nullable|string|max:255',
            'sex' => 'nullable|string|in:Male,Female',
        ], [
            'name.required' => 'Please enter your full name.',
            'email.unique' => 'This email address is already registered in the system.',
            'current_position_id.required' => 'Please select your position.',
            'current_position_id.in' => 'The selected position is invalid.',
        ]);

        $teacherData = [
            'position_range' => $validated['current_position_id'],
            'career_stage' => $validated['career_stage'] ?? null,
            'department' => $validated['department'] ?? null,
        ];

        $user = User::create([
            'name' => ucwords(strtolower($validated['name'])),
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'division' => json_encode($teacherData),
            'teacher_type' => $validated['teacher_status'] ?? null,
            'gender' => $validated['sex'] ?? null,
            'is_active' => false,
        ]);

        $user->assignRole('teacher');

        return redirect()->route('login')->with('status',
            'Registration received! Your account is pending admin approval - you will be able to log in once it is approved.'
        );
    }
}
