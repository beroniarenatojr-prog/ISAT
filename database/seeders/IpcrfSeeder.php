<?php

namespace Database\Seeders;

use App\Models\Kra;
use App\Models\Objective;
use App\Models\Competency;
use Illuminate\Database\Seeder;

class IpcrfSeeder extends Seeder
{
    public function run(): void
    {
        // KRA 1: Content Knowledge and Pedagogy
        $kra1 = Kra::create([
            'name' => 'Content Knowledge and Pedagogy',
            'description' => 'Applied knowledge of content within and across curriculum teaching areas',
            'order' => 1,
        ]);

        $objectives1 = [
            ['code' => '1.1.2', 'description' => 'Applied knowledge of content within and across curriculum teaching areas (PPST 1.1.2)', 'type' => 'COI'],
            ['code' => '1.2.2', 'description' => 'Used research-based knowledge and principles of teaching and learning in enhancing professional practice (PPST 1.2.2)', 'type' => 'NCOI'],
            ['code' => '1.3.2', 'description' => 'Ensured the positive use of ICT to facilitate the teaching and learning process (PPST 1.3.2)', 'type' => 'COI'],
            ['code' => '1.4.2', 'description' => 'Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills (PPST 1.4.2)', 'type' => 'COI'],
            ['code' => '1.7.2', 'description' => 'Used effective verbal and non-verbal classroom communication strategies to support learner understanding, participation, engagement and achievement (PPST 1.7.2)', 'type' => 'COI'],
        ];

        foreach ($objectives1 as $index => $obj) {
            $objective = Objective::create([
                'kra_id' => $kra1->id,
                'code' => $obj['code'],
                'description' => $obj['description'],
                'order' => $index + 1,
                'weight' => 7.14,
            ]);

            Competency::create([
                'objective_id' => $objective->id,
                'type' => $obj['type'],
                'weight' => 7.14,
            ]);
        }

        // KRA 2: Learning Environment & Diversity of Learners
        $kra2 = Kra::create([
            'name' => 'Learning Environment & Diversity of Learners',
            'order' => 2,
        ]);

        $objectives2 = [
            ['code' => '2.4.2', 'description' => 'Maintained learning environments that nurture and inspire learners to participate, cooperate and collaborate in continued learning (PPST 2.4.2)', 'type' => 'COI'],
            ['code' => '2.5.2', 'description' => 'Applied a range of successful strategies that maintain learning environments that motivate learners to work productively by assuming responsibility for their own learning (PPST 2.5.2)', 'type' => 'COI'],
            ['code' => '3.3.2', 'description' => 'Designed, adapted and implemented teaching strategies that are responsive to learners with disabilities, giftedness and talents (PPST 3.3.2)', 'type' => 'COI'],
            ['code' => '3.4.2', 'description' => 'Planned and delivered teaching strategies that are responsive to the special educational needs of learners in difficult circumstances', 'type' => 'COI'],
        ];

        foreach ($objectives2 as $index => $obj) {
            $objective = Objective::create([
                'kra_id' => $kra2->id,
                'code' => $obj['code'],
                'description' => $obj['description'],
                'order' => $index + 1,
                'weight' => 7.14,
            ]);

            Competency::create([
                'objective_id' => $objective->id,
                'type' => $obj['type'],
                'weight' => 7.14,
            ]);
        }

        // KRA 3: Curriculum and Planning & Assessment and Reporting
        $kra3 = Kra::create([
            'name' => 'Curriculum and Planning & Assessment and Reporting',
            'order' => 3,
        ]);

        $objective3 = Objective::create([
            'kra_id' => $kra3->id,
            'code' => '4.3.2',
            'description' => 'Adapted and implemented learning programs that ensure relevance and responsiveness to the needs of all learners (PPST 4.3.2)',
            'order' => 1,
            'weight' => 7.14,
        ]);

        Competency::create([
            'objective_id' => $objective3->id,
            'type' => 'NCOI',
            'weight' => 7.14,
        ]);

        // KRA 4: Community Linkages and Professional Engagement
        $kra4 = Kra::create([
            'name' => 'Community Linkages and Professional Engagement',
            'order' => 4,
        ]);

        $objectives4 = [
            ['code' => '6.1.2', 'description' => 'Maintained learning environments that are responsive to community contexts (PPST 6.1.2)', 'type' => 'NCOI'],
            ['code' => '6.3.2', 'description' => 'Reviewed regularly personal teaching practice using existing laws and principles of professional ethics and the responsibilities specified in the Code of Ethics for Professional Teachers (PPST 6.3.2)', 'type' => 'NCOI'],
            ['code' => '6.4.2', 'description' => 'Complied with and implemented school policies and procedures consistently to foster harmonious relationships with learners, parents, and other stakeholders (PPST 6.4.2)', 'type' => 'NCOI'],
        ];

        foreach ($objectives4 as $index => $obj) {
            $objective = Objective::create([
                'kra_id' => $kra4->id,
                'code' => $obj['code'],
                'description' => $obj['description'],
                'order' => $index + 1,
                'weight' => 7.14,
            ]);

            Competency::create([
                'objective_id' => $objective->id,
                'type' => $obj['type'],
                'weight' => 7.14,
            ]);
        }

        // KRA 5: Personal Growth and Professional Development
        $kra5 = Kra::create([
            'name' => 'Personal Growth and Professional Development',
            'order' => 5,
        ]);

        $objective5 = Objective::create([
            'kra_id' => $kra5->id,
            'code' => '7.2.2',
            'description' => 'Adapted practices that uphold the dignity of teaching as a profession by exhibiting qualities such as caring attitude, respect and integrity (PPST 7.2.2)',
            'order' => 1,
            'weight' => 7.14,
        ]);

        Competency::create([
            'objective_id' => $objective5->id,
            'type' => 'NCOI',
            'weight' => 7.14,
        ]);
    }
}
