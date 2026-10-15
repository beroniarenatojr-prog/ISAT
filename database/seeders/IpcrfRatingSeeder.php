<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Kra;
use App\Models\IpcrfRating;

class IpcrfRatingSeeder extends Seeder
{
    public function run(): void
    {
        // Get all teachers
        $teachers = User::role('teacher')->get();
        
        // Get all KRAs with objectives
        $kras = Kra::with('objectives')->orderBy('order')->get();

        if ($teachers->isEmpty() || $kras->isEmpty()) {
            $this->command->info('No teachers or KRAs found. Skipping IPCRF rating seeding.');
            return;
        }

        // Create sample ratings for each teacher
        foreach ($teachers as $teacher) {
            // Create rating for 2024-2025
            $kraDetails = [];
            $totalScore = 0;

            foreach ($kras as $kra) {
                // Objectives are not seeded on a fresh database; skip empty KRAs
                if ($kra->objectives->isEmpty()) {
                    continue;
                }

                $objectives = [];
                $kraScore = 0;
                $kraRatingSum = 0;

                foreach ($kra->objectives as $objective) {
                    $rating = rand(3, 5); // Random rating between 3-5
                    $score = ($rating * $objective->weight) / 5;
                    
                    $objectives[] = [
                        'objective_id' => $objective->id,
                        'objective_code' => $objective->code,
                        'objective_description' => $objective->description,
                        'rating' => $rating,
                        'score' => round($score, 2),
                    ];

                    $kraScore += $score;
                    $kraRatingSum += $rating;
                }

                $kraDetails[] = [
                    'kra_id' => $kra->id,
                    'kra_name' => $kra->name,
                    'weight' => $this->getKraWeight($kra->id),
                    'objectives' => $objectives,
                    'average_rating' => round($kraRatingSum / count($objectives), 2),
                    'score' => round($kraScore, 2),
                ];

                $totalScore += $kraScore;
            }

            IpcrfRating::create([
                'teacher_id' => $teacher->id,
                'rating_period' => '2024-2025',
                'kra_details' => $kraDetails,
                'total_score' => round($totalScore, 2),
                'numerical_rating' => round($totalScore / $kras->count(), 2),
                'status' => ['draft', 'submitted', 'approved'][rand(0, 2)],
                'remarks' => 'Sample rating for demonstration purposes.',
                'created_by' => 1, // Assuming admin user ID is 1
            ]);

            $this->command->info("Created IPCRF rating for {$teacher->name}");
        }
    }

    /**
     * Get standard KRA weight based on KRA ID
     */
    private function getKraWeight($kraId): int
    {
        $weights = [
            1 => 30, // KRA 1: Content Knowledge and Pedagogy
            2 => 20, // KRA 2: Learning Environment & Diversity
            3 => 20, // KRA 3: Curriculum and Planning
            4 => 20, // KRA 4: Community Linkages
            5 => 10, // KRA 5: Personal Growth
        ];
        
        return $weights[$kraId] ?? 20; // Default to 20% if not found
    }
}
