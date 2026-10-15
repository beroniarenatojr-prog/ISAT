<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuestionnaireTemplate;
use App\Models\SelfRatingSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Administrator-only management of assessment tools:
 *   - Questionnaire / self-assessment templates (title, questions, scales)
 *       * kind "shs"  - profile + performance/challenges KRA groups
 *       * kind "flat" - one scale + one flat list of statements (e-TRACES survey)
 *   - KRA self-rating settings (weight, active)
 *
 * Gated by the `administrator` middleware in routes/admin.php.
 */
class AssessmentToolController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/AssessmentTools', [
            'templates' => QuestionnaireTemplate::orderBy('title')->get()->map(fn ($t) => [
                'id' => $t->id,
                'key' => $t->key,
                'title' => $t->title,
                'description' => $t->description,
                'is_active' => $t->is_active,
                'kind' => $t->kind(),
                'structure' => $t->structure,
                'response_count' => $t->responses()->count(),
                'performance_item_count' => count($t->performanceItems()),
                'challenge_item_count' => count($t->challengeItems()),
                'flat_item_count' => count($t->flatItems()),
                'updated_at' => $t->updated_at?->toDateTimeString(),
            ]),
            'selfRating' => SelfRatingSetting::current(),
        ]);
    }

    public function updateTemplate(Request $request, QuestionnaireTemplate $template)
    {
        $data = $this->validateTemplate($request);
        $kind = $data['kind'] ?? $template->kind();

        $template->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'structure' => $this->normaliseStructure($data['structure'] ?? $template->structure, $kind),
        ]);

        return back()->with('success', 'Questionnaire saved.');
    }

    public function updateSelfRating(Request $request)
    {
        $validated = $request->validate([
            'total_weight' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        SelfRatingSetting::current()->update([
            'total_weight' => round($validated['total_weight'], 2),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Self-rating settings updated.');
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'boolean',
            'kind' => 'nullable|in:shs,flat',
            'structure' => 'required|array',
        ]);
    }

    /**
     * Sanitise a structure by kind: re-number items 1..n, drop empty rows,
     * keep the scale rows well-formed.
     */
    private function normaliseStructure(array $structure, string $kind): array
    {
        $structure['kind'] = $kind;

        $cleanScale = fn ($scale) => collect(is_array($scale) ? $scale : [])
            ->map(fn ($s, $i) => [
                'value' => (int) ($s['value'] ?? ($i + 1)),
                'label' => trim((string) ($s['label'] ?? '')),
                'description' => trim((string) ($s['description'] ?? '')),
            ])
            ->all();

        if ($kind === 'flat') {
            $structure['instructions'] = trim((string) ($structure['instructions'] ?? ''));
            $structure['scale'] = $cleanScale($structure['scale'] ?? []);
            $structure['items'] = collect($structure['items'] ?? [])
                ->filter(fn ($it) => trim((string) ($it['text'] ?? '')) !== '')
                ->values()
                ->map(fn ($it, $i) => ['no' => $i + 1, 'text' => trim($it['text'])])
                ->all();

            unset($structure['performance'], $structure['challenges'], $structure['profile_fields']);

            return $structure;
        }

        // kind "shs"
        foreach (['performance', 'challenges'] as $part) {
            if (! isset($structure[$part]) || ! is_array($structure[$part])) {
                continue;
            }
            $structure[$part]['title'] = trim((string) ($structure[$part]['title'] ?? ''));
            $structure[$part]['scale'] = $cleanScale($structure[$part]['scale'] ?? []);
            $structure[$part]['kras'] = collect($structure[$part]['kras'] ?? [])
                ->map(function ($kra) {
                    $items = collect($kra['items'] ?? [])
                        ->filter(fn ($it) => trim((string) ($it['text'] ?? '')) !== '')
                        ->values()
                        ->map(fn ($it, $i) => ['no' => $i + 1, 'text' => trim($it['text'])])
                        ->all();

                    return ['code' => $kra['code'] ?? '', 'title' => $kra['title'] ?? '', 'items' => $items];
                })
                ->all();
        }
        unset($structure['items']);

        return $structure;
    }

}
