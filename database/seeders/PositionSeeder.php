<?php

namespace Database\Seeders;

use App\Models\Position;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    /**
     * Seed the positions table with teacher ranks
     */
    public function run(): void
    {
        // Delete old positions that are being merged
        Position::whereIn('name', ['Beginner', 'Proficient'])->delete();

        $positions = [
            ['name' => 'Beginning Towards Proficient', 'order' => 1, 'parent_position_id' => null],
            ['name' => 'Highly Proficient', 'order' => 2, 'parent_position_id' => null],
            ['name' => 'Distinguished', 'order' => 3, 'parent_position_id' => null],
        ];

        foreach ($positions as $position) {
            Position::updateOrCreate(
                ['name' => $position['name']],
                $position
            );
        }

        // Set parent relationships for hierarchy
        $beginningProficient = Position::where('name', 'Beginning Towards Proficient')->first();
        $highlyProficient = Position::where('name', 'Highly Proficient')->first();
        $distinguished = Position::where('name', 'Distinguished')->first();

        if ($beginningProficient && $highlyProficient) {
            $highlyProficient->update(['parent_position_id' => $beginningProficient->id]);
        }
        if ($highlyProficient && $distinguished) {
            $distinguished->update(['parent_position_id' => $highlyProficient->id]);
        }
    }
}
