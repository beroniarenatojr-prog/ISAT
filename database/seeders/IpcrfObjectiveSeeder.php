<?php

namespace Database\Seeders;

use App\Models\Kra;
use App\Models\Objective;
use Illuminate\Database\Seeder;

/**
 * Canonical IPCRF KRAs + objectives.
 *
 *   .2 strand -> Teacher I-III (Proficient) PPST indicators
 *   .3 strand -> Master Teacher I-II (Highly Proficient) PPST indicators
 *   KRA number == PPST domain number.
 *
 * KRAs are matched on `order`, objectives on `code`, so re-running updates in
 * place - no duplicates. Objectives are left tier-agnostic (position_tiers =
 * null) so they all appear, with checkboxes, in the "Select Objectives" panel
 * for every position tier; the Principal ticks what belongs in each config.
 */
class IpcrfObjectiveSeeder extends Seeder
{
    private const WEIGHT = 6.786;

    /** order => name (PPST domain names). KRA 6 has no objectives here but is
     *  kept so "Personal Growth..." stays at KRA 7. */
    private array $kras = [
        1 => 'Content Knowledge and Pedagogy',
        2 => 'Learning Environment',
        3 => 'Diversity of Learners',
        4 => 'Curriculum and Planning',
        5 => 'Assessment and Reporting',
        6 => 'Community Linkages and Professional Engagement',
        7 => 'Personal Growth and Professional Development',
    ];

    /** [code, kraOrder, description] - ordered by code. */
    private array $objectives = [
        // ---- KRA 1 ----
        ['1.1.2', 1, 'Applied knowledge of content within and across curriculum teaching areas'],
        ['1.1.3', 1, 'Modelled effective applications of content knowledge within and across curriculum teaching areas'],
        ['1.4.2', 1, 'Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills'],
        ['1.4.3', 1, 'Evaluated with colleagues the effectiveness of teaching strategies that promote learner achievement in literacy and numeracy'],
        ['1.5.2', 1, 'Applied a range of teaching strategies to develop critical and creative thinking, as well as other higher-order thinking skills'],
        ['1.5.3', 1, 'Developed and applied effective teaching strategies to promote critical and creative thinking, as well as other higher-order thinking skills'],

        // ---- KRA 2 ----
        ['2.3.3', 2, 'Worked with colleagues to model and share effective techniques in the management of classroom structure to engage learners, individually or in groups, in meaningful exploration, discovery and hands-on activities within a range of physical learning environments'],
        ['2.6.3', 2, 'Exhibited effective and constructive behavior management skills by applying positive and non-violent discipline to ensure learning-focused environments'],

        // ---- KRA 3 ----
        ['3.1.3', 3, "Worked with colleagues to share differentiated, developmentally appropriate opportunities to address learners' differences in gender, needs, strengths, interests and experiences"],

        // ---- KRA 4 ----
        ['4.1.2', 4, 'Planned, managed and implemented developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts'],
        ['4.1.3', 4, 'Developed and applied effective strategies in the planning and management of developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts'],
        ['4.4.2', 4, 'Participated in collegial discussions that use teacher and learner feedback to enrich teaching practice'],
        ['4.4.3', 4, 'Reviewed with colleagues, teacher and learner feedback to plan, facilitate and enrich teaching practice'],
        ['4.5.2', 4, 'Selected, developed, organized and used appropriate teaching and learning resources, including ICT, to address specific learning goals'],
        ['4.5.3', 4, 'Advised and guided colleagues in the selection, organization, development and use of appropriate teaching and learning resources, including ICT, to address specific learning goals'],

        // ---- KRA 5 ----
        ['5.1.2', 5, 'Designed, selected, organized and used diagnostic, formative and summative assessment strategies consistent with curriculum requirements'],
        ['5.1.3', 5, 'Worked collaboratively with colleagues to review the design, selection, organization and use of a range of effective diagnostic, formative and summative assessment strategies consistent with curriculum requirements'],
        ['5.2.2', 5, 'Monitored and evaluated learner progress and achievement using learner attainment data'],
        ['5.2.3', 5, 'Interpreted collaboratively monitoring and evaluation strategies of attainment data to support learner progress and achievement'],
        ['5.4.2', 5, "Communicated promptly and clearly the learners' needs, progress and achievement to key stakeholders, including parents/guardians"],
        ['5.4.3', 5, 'Applied skills in the effective communication of learner needs, progress and achievement to key stakeholders, including parents/guardians'],

        // ---- KRA 7 ----
        ['7.1.2', 7, 'Applied a personal philosophy of teaching that is learner-centered'],
        ['7.1.3', 7, 'Manifested a learner-centered teaching philosophy in various aspects of practice and support colleagues in enhancing their own learner-centered teaching philosophy'],
        ['7.5.2', 7, 'Set professional development goals based on the Philippine Professional Standards for Teachers'],
        ['7.5.3', 7, 'Reflected on the Philippine Professional Standards for Teachers to plan personal professional development goals and assist colleagues in planning and achieving their own goals'],
    ];

    public function run(): void
    {
        $kraIdByOrder = [];

        foreach ($this->kras as $order => $name) {
            $kra = Kra::updateOrCreate(
                ['order' => $order],
                [
                    'name' => $name,
                    'description' => "PPST Domain {$order} - {$name}.",
                    'is_active' => true,
                ]
            );
            $kraIdByOrder[$order] = $kra->id;
        }

        $orderInKra = [];

        foreach ($this->objectives as [$code, $kraOrder, $description]) {
            $orderInKra[$kraOrder] = ($orderInKra[$kraOrder] ?? 0) + 1;

            Objective::updateOrCreate(
                ['code' => $code],
                [
                    'kra_id' => $kraIdByOrder[$kraOrder],
                    'description' => $description,
                    'order' => $orderInKra[$kraOrder],
                    'weight' => self::WEIGHT,
                    'is_active' => true,
                    'is_custom' => false,
                    'position_tiers' => null,
                ]
            );
        }

        $this->command->info(sprintf(
            'IpcrfObjectiveSeeder: %d KRAs, %d objectives.',
            count($this->kras),
            count($this->objectives),
        ));
    }
}
