<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionnaireTemplate extends Model
{
    protected $fillable = [
        'key',
        'title',
        'description',
        'structure',
        'is_active',
    ];

    protected $casts = [
        'structure' => 'array',
        'is_active' => 'boolean',
    ];

    public function responses()
    {
        return $this->hasMany(ShsQuestionnaireResponse::class);
    }

    /** 'shs' (profile + performance/challenges KRA groups) or 'flat' (one list). */
    public function kind(): string
    {
        return $this->structure['kind'] ?? 'shs';
    }

    /** Flat "kind" questionnaire items: [{no, text}]. */
    public function flatItems(): array
    {
        return $this->structure['items'] ?? [];
    }

    /** Flat list of every performance item: [{kra, no, text, key}]. */
    public function performanceItems(): array
    {
        return $this->flattenItems($this->structure['performance']['kras'] ?? [], 'p');
    }

    /** Flat list of every challenge item: [{kra, no, text, key}]. */
    public function challengeItems(): array
    {
        return $this->flattenItems($this->structure['challenges']['kras'] ?? [], 'c');
    }

    private function flattenItems(array $kras, string $prefix): array
    {
        $items = [];
        foreach ($kras as $ki => $kra) {
            foreach ($kra['items'] ?? [] as $item) {
                $items[] = [
                    'kra' => $kra['title'] ?? '',
                    'kra_code' => $kra['code'] ?? '',
                    'no' => $item['no'] ?? null,
                    'text' => $item['text'] ?? '',
                    'key' => "{$prefix}_{$ki}_{$item['no']}",
                ];
            }
        }

        return $items;
    }
}
