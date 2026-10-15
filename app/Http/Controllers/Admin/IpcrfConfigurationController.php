<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IpcrfConfiguration;
use App\Models\TeacherSubmission;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IpcrfConfigurationController extends Controller
{
    protected $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Position tiers the current user may configure.
     *   Principal (super-admin) -> every tier (Teacher I ... Master Teacher V)
     *   Master Teacher (admin)   -> Teacher tiers only; MT tiers are Principal-only
     */
    private function allowedTiers(): array
    {
        if (auth()->user()->hasRole('super-admin')) {
            return IpcrfConfiguration::POSITION_TIERS;
        }

        return array_values(array_filter(
            IpcrfConfiguration::POSITION_TIERS,
            fn ($tier) => ! str_starts_with($tier, 'MT'),
        ));
    }

    /**
     * Block a Master Teacher from touching a Master-Teacher-tier configuration.
     * Returns a redirect response when denied, otherwise null.
     */
    private function denyIfTierNotAllowed(?string $tier)
    {
        if ($tier && ! in_array($tier, $this->allowedTiers(), true)) {
            return redirect()->back()->with(
                'error',
                'Only the Principal can manage configurations for the ' . $tier . ' position tier.'
            );
        }

        return null;
    }

    public function index(): Response
    {
        // Get all configurations with their custom KRAs and objectives
        $configurations = IpcrfConfiguration::with([
            'customKras.objectives' => function ($query) {
                $query->where('is_active', true)->orderBy('order');
            },
            'customKras' => function ($query) {
                $query->where('is_active', true)->orderBy('order');
            }
        ])
        ->orderBy('school_year', 'desc')
        ->orderByRaw('position_tier IS NULL DESC')
        ->orderBy('position_tier')
        ->get();
        
        // Every KRA with every objective, whatever their status. Inactive items
        // are shown unselected and badged rather than hidden, so nothing the
        // admin created can silently vanish from this screen.
        $kras = \App\Models\Kra::with(['objectives' => function ($query) {
            $query->orderBy('order');
        }])
        ->orderBy('order')
        ->get();
        
        return Inertia::render('Admin/IpcrfConfiguration', [
            'configurations' => $configurations,
            'currentYear' => date('Y'),
            'defaultKras' => $kras,
            // Only the tiers this user may create/edit a configuration for.
            'positionTiers' => $this->allowedTiers(),
            'canManageAllTiers' => auth()->user()->hasRole('super-admin'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_year' => 'required|string',
            'position_tier' => [
                'required',
                Rule::in($this->allowedTiers()),
                Rule::unique('ipcrf_configurations', 'position_tier')
                    ->where(fn ($query) => $query->where('school_year', $request->input('school_year'))),
            ],
            'kra_count' => 'required|integer|min:1|max:10',
            'objectives_per_kra' => 'nullable|array',
            'objectives_per_kra.*' => 'required|integer|min:0|max:20',
            'selected_objective_ids' => 'nullable|array',
            'selected_objective_ids.*' => 'required|integer',
            'custom_kras' => 'nullable|array',
            'custom_kras.*.temp_id' => 'nullable|string|max:100',
            'custom_kras.*.name' => 'required|string|max:255',
            'custom_kras.*.description' => 'nullable|string',
            'custom_objectives' => 'nullable|array',
            // May be an existing KRA id or the client-side temp id of a custom
            // KRA being created in the same request
            'custom_objectives.*.kra_id' => 'required',
            'custom_objectives.*.code' => 'required|string|max:50',
            'custom_objectives.*.description' => 'required|string|max:500',
            'custom_objectives.*.weight' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:500',
        ], [
            'position_tier.required' => 'Please choose the position tier this configuration applies to.',
            'position_tier.in' => 'Only the Principal can create a configuration for a Master Teacher (MT) position tier.',
            'position_tier.unique' => 'A configuration for this position tier already exists for the selected school year.',
        ]);

        // Ensure at least one objective (default or custom) is selected
        $hasDefaultObjectives = !empty($validated['selected_objective_ids']);
        $hasCustomObjectives = !empty($validated['custom_objectives']);
        
        if (!$hasDefaultObjectives && !$hasCustomObjectives) {
            return redirect()->back()
                ->withErrors(['selected_objective_ids' => 'You must select at least one objective or add a custom objective.'])
                ->withInput();
        }

        if ($error = $this->validateCustomObjectiveKras($validated)) {
            return redirect()->back()->withErrors($error)->withInput();
        }

        $configuration = IpcrfConfiguration::create([
            'school_year' => $validated['school_year'],
            'position_tier' => $validated['position_tier'],
            'kra_count' => $validated['kra_count'],
            'objectives_per_kra' => $validated['objectives_per_kra'] ?? [],
            'selected_objective_ids' => $validated['selected_objective_ids'] ?? [],
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncCustomItems($validated, $configuration);

        // Log the action
        $this->auditLogService->log(
            'create',
            "Created IPCRF configuration for {$validated['school_year']} ({$validated['position_tier']})",
            'IpcrfConfiguration',
            $configuration->id
        );

        return redirect()->back()->with('success', 'Configuration created successfully!');
    }

    public function update(Request $request, IpcrfConfiguration $configuration)
    {
        // Check if configuration is locked
        if ($configuration->is_locked) {
            return redirect()->back()->with('error', 'This configuration is locked and cannot be modified.');
        }

        if ($denied = $this->denyIfTierNotAllowed($configuration->position_tier)) {
            return $denied;
        }

        $validated = $request->validate([
            'school_year' => 'required|string',
            'position_tier' => [
                'required',
                Rule::in($this->allowedTiers()),
                Rule::unique('ipcrf_configurations', 'position_tier')
                    ->where(fn ($query) => $query->where('school_year', $request->input('school_year')))
                    ->ignore($configuration->id),
            ],
            'kra_count' => 'required|integer|min:1|max:10',
            'objectives_per_kra' => 'nullable|array',
            'objectives_per_kra.*' => 'required|integer|min:0|max:20',
            'selected_objective_ids' => 'nullable|array',
            'selected_objective_ids.*' => 'required|integer',
            'custom_kras' => 'nullable|array',
            'custom_kras.*.temp_id' => 'nullable|string|max:100',
            'custom_kras.*.name' => 'required|string|max:255',
            'custom_kras.*.description' => 'nullable|string',
            'custom_objectives' => 'nullable|array',
            // May be an existing KRA id or the client-side temp id of a custom
            // KRA being created in the same request
            'custom_objectives.*.kra_id' => 'required',
            'custom_objectives.*.code' => 'required|string|max:50',
            'custom_objectives.*.description' => 'required|string|max:500',
            'custom_objectives.*.weight' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:500',
        ], [
            'position_tier.required' => 'Please choose the position tier this configuration applies to.',
            'position_tier.in' => 'Only the Principal can create a configuration for a Master Teacher (MT) position tier.',
            'position_tier.unique' => 'A configuration for this position tier already exists for the selected school year.',
        ]);

        // Ensure at least one objective (default or custom) is selected
        $hasDefaultObjectives = !empty($validated['selected_objective_ids']);
        $hasCustomObjectives = !empty($validated['custom_objectives']);
        
        if (!$hasDefaultObjectives && !$hasCustomObjectives) {
            return redirect()->back()
                ->withErrors(['selected_objective_ids' => 'You must select at least one objective or add a custom objective.'])
                ->withInput();
        }

        if ($error = $this->validateCustomObjectiveKras($validated)) {
            return redirect()->back()->withErrors($error)->withInput();
        }

        $configuration->update([
            'school_year' => $validated['school_year'],
            'position_tier' => $validated['position_tier'],
            'kra_count' => $validated['kra_count'],
            'objectives_per_kra' => $validated['objectives_per_kra'] ?? [],
            'selected_objective_ids' => $validated['selected_objective_ids'] ?? [],
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncCustomItems($validated, $configuration);

        // Log the action
        $this->auditLogService->log(
            'update',
            "Updated IPCRF configuration for {$validated['school_year']} ({$validated['position_tier']})",
            'IpcrfConfiguration',
            $configuration->id
        );

        return redirect()->back()->with('success', 'Configuration updated successfully!');
    }

    public function destroy(IpcrfConfiguration $configuration)
    {
        // Check if configuration is locked
        if ($configuration->is_locked) {
            return redirect()->back()->with('error', 'This configuration is locked and cannot be deleted.');
        }

        if ($denied = $this->denyIfTierNotAllowed($configuration->position_tier)) {
            return $denied;
        }

        // Check if configuration is being used by teachers of this tier
        $submissionsQuery = TeacherSubmission::where('school_year', $configuration->school_year);

        if ($configuration->position_tier) {
            $tierTeacherIds = $this->teacherIdsForTier($configuration->position_tier);

            if (empty($tierTeacherIds)) {
                $submissionsQuery->whereRaw('1 = 0');
            } else {
                $submissionsQuery->whereIn('teacher_id', $tierTeacherIds);
            }
        }

        $submissionsCount = $submissionsQuery->count();
        
        if ($submissionsCount > 0) {
            return redirect()->back()->with('error', "Cannot delete: {$submissionsCount} submission(s) exist for this school year and position tier.");
        }

        $schoolYear = $configuration->school_year;
        $tier = $configuration->position_tier ?? 'All tiers';
        $configuration->delete();

        // Log the action
        $this->auditLogService->log(
            'delete',
            "Deleted IPCRF configuration for {$schoolYear} ({$tier})",
            'IpcrfConfiguration',
            $configuration->id
        );

        return redirect()->back()->with('success', 'Configuration deleted successfully!');
    }

    public function toggleActive(IpcrfConfiguration $configuration)
    {
        if ($denied = $this->denyIfTierNotAllowed($configuration->position_tier)) {
            return $denied;
        }

        // Only one active configuration per position tier, so activating this one
        // deactivates the other configurations targeting the same tier.
        if (!$configuration->is_active) {
            IpcrfConfiguration::where('id', '!=', $configuration->id)
                ->when(
                    $configuration->position_tier,
                    fn ($query) => $query->where('position_tier', $configuration->position_tier),
                    fn ($query) => $query->whereNull('position_tier')
                )
                ->update(['is_active' => false]);
        }

        $configuration->update(['is_active' => !$configuration->is_active]);

        // Log the action
        $status = $configuration->is_active ? 'activated' : 'deactivated';
        $tier = $configuration->position_tier ?? 'All tiers';
        $this->auditLogService->log(
            'update',
            "Configuration for {$configuration->school_year} ({$tier}) {$status}",
            'IpcrfConfiguration',
            $configuration->id
        );

        return redirect()->back()->with('success', 'Configuration status updated!');
    }

    public function toggleLock(IpcrfConfiguration $configuration)
    {
        if ($denied = $this->denyIfTierNotAllowed($configuration->position_tier)) {
            return $denied;
        }

        $configuration->update(['is_locked' => !$configuration->is_locked]);

        // Log the action
        $status = $configuration->is_locked ? 'locked' : 'unlocked';
        $tier = $configuration->position_tier ?? 'All tiers';
        $this->auditLogService->log(
            'update',
            "Configuration for {$configuration->school_year} ({$tier}) {$status}",
            'IpcrfConfiguration',
            $configuration->id
        );

        return redirect()->back()->with('success', 'Configuration lock status updated!');
    }

    /**
     * Check up front that every custom objective points at a KRA we can resolve:
     * either an existing KRA row, or the temp id of a custom KRA in this request.
     *
     * @return array<string, string>|null  Validation errors, or null when valid.
     */
    protected function validateCustomObjectiveKras(array $validated): ?array
    {
        if (empty($validated['custom_objectives'])) {
            return null;
        }

        $tempIds = collect($validated['custom_kras'] ?? [])
            ->pluck('temp_id')
            ->filter()
            ->all();

        foreach ($validated['custom_objectives'] as $index => $objData) {
            $kraId = $objData['kra_id'];

            if (is_numeric($kraId) && \App\Models\Kra::whereKey((int) $kraId)->exists()) {
                continue;
            }

            if (in_array((string) $kraId, $tempIds, true)) {
                continue;
            }

            return [
                "custom_objectives.{$index}.kra_id" =>
                    'Custom objective "' . ($objData['code'] ?? $index + 1)
                    . '" is not attached to a valid KRA. Please pick a KRA for it.',
            ];
        }

        return null;
    }

    /**
     * Create the custom KRAs and objectives for a configuration.
     *
     * Custom KRAs are created first so their new database ids can be mapped
     * back to the client-side temp ids their objectives reference.
     */
    protected function syncCustomItems(array $validated, IpcrfConfiguration $configuration): void
    {
        $kraIdMap = [];

        if (!empty($validated['custom_kras'])) {
            foreach ($validated['custom_kras'] as $index => $kraData) {
                $kra = \App\Models\Kra::create([
                    'name' => $kraData['name'],
                    'description' => $kraData['description'] ?? null,
                    'order' => 100 + $index, // Keep clear of the default KRAs
                    'is_active' => true,
                    'is_custom' => true,
                    'position_tiers' => [$configuration->position_tier],
                    'ipcrf_configuration_id' => $configuration->id,
                ]);

                if (!empty($kraData['temp_id'])) {
                    $kraIdMap[$kraData['temp_id']] = $kra->id;
                }
            }
        }

        if (empty($validated['custom_objectives'])) {
            return;
        }

        $selectedIds = $configuration->selected_objective_ids ?? [];

        foreach ($validated['custom_objectives'] as $objData) {
            $kraId = $this->resolveKraId($objData['kra_id'], $kraIdMap);

            if (!$kraId) {
                continue;
            }

            $objective = \App\Models\Objective::create([
                'kra_id' => $kraId,
                'code' => $objData['code'],
                'description' => $objData['description'],
                'weight' => $objData['weight'] ?? 6.786,
                'order' => 100, // Custom objectives sit at the end
                'is_active' => true,
                'is_custom' => true,
                'position_tiers' => [$configuration->position_tier],
                'ipcrf_configuration_id' => $configuration->id,
            ]);

            $selectedIds[] = $objective->id;
        }

        // Single write instead of one per objective
        $configuration->update(['selected_objective_ids' => array_values(array_unique($selectedIds))]);
    }

    /**
     * Turn a submitted kra_id into a real KRA id.
     */
    protected function resolveKraId(mixed $kraId, array $kraIdMap): ?int
    {
        if (isset($kraIdMap[(string) $kraId])) {
            return $kraIdMap[(string) $kraId];
        }

        if (is_numeric($kraId) && \App\Models\Kra::whereKey((int) $kraId)->exists()) {
            return (int) $kraId;
        }

        return null;
    }

    /**
     * Resolve the teacher IDs whose position range matches the given tier.
     * Position data lives inside the `division` JSON column.
     */
    protected function teacherIdsForTier(string $positionTier): array
    {
        return \App\Models\User::role('teacher')
            ->get(['id', 'division'])
            ->filter(function ($teacher) use ($positionTier) {
                $division = json_decode($teacher->division, true);

                return is_array($division)
                    && ($division['position_range'] ?? null) === $positionTier;
            })
            ->pluck('id')
            ->all();
    }
}
