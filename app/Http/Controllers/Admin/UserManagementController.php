<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

/**
 * Manage staff accounts - Administrative (super-admin) and Master Teacher
 * (admin). Super-admin only; wired up in routes/admin.php under the super-admin
 * group.
 *
 * Creating an Administrative (super-admin) account is reserved for the
 * Administrator - a plain Principal may only create Master Teacher accounts.
 */
class UserManagementController extends Controller
{
    /** Roles this page is allowed to manage. */
    private const MANAGED_ROLES = ['super-admin', 'admin'];

    /** Wording shown in the UI for each spatie role key. */
    private const ROLE_LABELS = [
        'super-admin' => 'Principal',
        'admin' => 'Master Teacher',
    ];

    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $roleFilter = $request->input('role', '');

        $query = User::query()
            ->with('roles')
            ->whereHas('roles', fn ($q) => $q->whereIn('name', self::MANAGED_ROLES));

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (in_array($roleFilter, self::MANAGED_ROLES, true)) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $roleFilter));
        }

        $canManagePrincipal = $request->user()->isAdministrator();

        $users = $query->orderBy('name')->paginate(10)->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->pluck('name')->first(),
                'role_label' => $this->managedLabel($user),
                'is_active' => (bool) ($user->is_active ?? true),
                'created_at' => $user->created_at?->toDateString(),
                'is_self' => $user->id === $request->user()->id,
            ]);

        // A plain Principal can only create Master Teacher accounts; the
        // Administrator can also create Administrative (super-admin) accounts.
        $roleOptions = collect(self::MANAGED_ROLES)
            ->when(! $canManagePrincipal, fn ($roles) => $roles->reject(fn ($r) => $r === 'super-admin'))
            ->map(fn ($key) => ['value' => $key, 'label' => self::ROLE_LABELS[$key]])
            ->values();

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            'roleOptions' => $roleOptions,
            'canManagePrincipal' => $canManagePrincipal,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /** UI label for a managed account (Administrator kept distinct). */
    private function managedLabel(User $user): string
    {
        if ($user->isAdministrator()) {
            return $user->roleLabel(); // "Administrator"
        }

        return $user->hasRole('super-admin')
            ? self::ROLE_LABELS['super-admin']
            : self::ROLE_LABELS['admin'];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(self::MANAGED_ROLES)],
        ]);

        $this->assertMayAssignRole($request, $validated['role']);

        Role::firstOrCreate(['name' => $validated['role']]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);
        $user->syncRoles([$validated['role']]);

        return back()->with('success', self::ROLE_LABELS[$validated['role']] . ' account created.');
    }

    public function update(Request $request, User $user)
    {
        $this->assertManaged($user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(self::MANAGED_ROLES)],
            'is_active' => 'boolean',
        ]);

        // Only the Administrator may hand out the Administrative (super-admin) role.
        if ($validated['role'] === 'super-admin' && ! $user->hasRole('super-admin')) {
            $this->assertMayAssignRole($request, 'super-admin');
        }

        // Never let the last Administrative account be demoted or locked out.
        if ($user->hasRole('super-admin') && $validated['role'] !== 'super-admin') {
            $this->assertNotLastSuperAdmin($user, 'demote');
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $request->boolean('is_active', $user->is_active ?? true),
        ]);
        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'Account updated.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->assertManaged($user);

        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);

        return back()->with('success', "Password reset for {$user->name}.");
    }

    public function destroy(Request $request, User $user)
    {
        $this->assertManaged($user);

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->hasRole('super-admin')) {
            $this->assertNotLastSuperAdmin($user, 'delete');
        }

        $name = $user->name;
        $user->syncRoles([]);
        $user->delete();

        return back()->with('success', "{$name} deleted.");
    }

    /**
     * Creating / assigning the Administrative (super-admin) role is reserved for
     * the Administrator. Everyone managing this page may assign Master Teacher.
     */
    private function assertMayAssignRole(Request $request, string $role): void
    {
        if ($role === 'super-admin' && ! $request->user()->isAdministrator()) {
            throw ValidationException::withMessages([
                'role' => 'Only the Administrator can create or assign a Principal account.',
            ]);
        }
    }

    /** Only super-admin / admin accounts are editable through this page. */
    private function assertManaged(User $user): void
    {
        if (! $user->hasAnyRole(self::MANAGED_ROLES)) {
            throw ValidationException::withMessages([
                'role' => 'This account is not managed from the User Management page.',
            ]);
        }
    }

    private function assertNotLastSuperAdmin(User $user, string $action): void
    {
        $others = User::role('super-admin')->where('id', '!=', $user->id)->count();

        if ($others === 0) {
            throw ValidationException::withMessages([
                'role' => "You cannot {$action} the only Principal account.",
            ]);
        }
    }
}
