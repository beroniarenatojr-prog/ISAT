<?php

namespace Database\Seeders;

use App\Models\QuestionnaireTemplate;
use Illuminate\Database\Seeder;

/**
 * "Senior High School Teachers - Performance Rating & Challenges Encountered"
 * self-assessment instrument.
 *
 *   PART I   - Profile
 *   PART II  - Performance rating (14 items across 5 KRAs)
 *   PART III - Challenges encountered (60 items across 5 KRAs)
 *
 * Seeded as a single questionnaire_templates row (key: shs-performance) that the
 * teacher panel renders under "IPCRF Questionnaires". Re-running updates the
 * definition in place; teacher answers live in shs_questionnaire_responses.
 */
class ShsQuestionnaireSeeder extends Seeder
{
    private const KEY = 'shs-performance';

    public function run(): void
    {
        QuestionnaireTemplate::updateOrCreate(
            ['key' => self::KEY],
            [
                'title' => 'SHS Teachers – Performance Rating & Challenges Encountered',
                'description' => 'Self-assessment for Senior High School teachers: profile, '
                    . 'performance rating across the 5 KRAs, and challenges encountered.',
                'is_active' => true,
                'structure' => [
                    'profile_fields' => $this->profileFields(),
                    'performance' => [
                        'title' => 'PART II – Performance Rating of Senior High School Teachers',
                        'scale' => $this->performanceScale(),
                        'kras' => $this->performanceKras(),
                    ],
                    'challenges' => [
                        'title' => 'PART III – Challenges Encountered by the Senior High School Teachers',
                        'scale' => $this->challengesScale(),
                        'kras' => $this->challengeKras(),
                    ],
                ],
            ]
        );

        $this->command->info('ShsQuestionnaireSeeder: "'.self::KEY.'" template seeded (14 performance + 60 challenge items).');
    }

    /** PART I – PROFILE */
    private function profileFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Name (Optional)', 'type' => 'text', 'required' => false],
            ['key' => 'age', 'label' => 'Age', 'type' => 'number', 'required' => true],
            ['key' => 'teaching_position', 'label' => 'Teaching Position', 'type' => 'text', 'required' => true],
            ['key' => 'years_of_service', 'label' => 'Years of Service', 'type' => 'text', 'required' => true],
            ['key' => 'bachelors_degree', 'label' => "Bachelor's Degree", 'type' => 'text', 'required' => true],
            ['key' => 'year_level_assignment', 'label' => 'Year Level Assignment', 'type' => 'text', 'required' => true],
            ['key' => 'subject_taught', 'label' => 'Subject Taught', 'type' => 'text', 'required' => true],
            [
                'key' => 'trainings_attended',
                'label' => 'Please list all trainings attended for the last three (3) years.',
                'type' => 'training_table',
                'required' => false,
                'columns' => [
                    ['key' => 'title', 'label' => 'Title of Training'],
                    ['key' => 'level', 'label' => 'Level', 'options' => [
                        'International', 'National', 'Regional', 'Division', 'School-based',
                    ]],
                    ['key' => 'year', 'label' => 'Year Attended', 'type' => 'year'],
                ],
            ],
        ];
    }

    private function performanceScale(): array
    {
        return [
            ['value' => 5, 'label' => 'O', 'description' => 'Outstanding'],
            ['value' => 4, 'label' => 'VS', 'description' => 'Very Satisfactory'],
            ['value' => 3, 'label' => 'S', 'description' => 'Satisfactory'],
            ['value' => 2, 'label' => 'F', 'description' => 'Fair'],
            ['value' => 1, 'label' => 'P', 'description' => 'Poor'],
        ];
    }

    private function challengesScale(): array
    {
        return [
            ['value' => 5, 'label' => 'SA', 'description' => 'Strongly Agree'],
            ['value' => 4, 'label' => 'A', 'description' => 'Agree'],
            ['value' => 3, 'label' => 'MA', 'description' => 'Moderately Agree'],
            ['value' => 2, 'label' => 'D', 'description' => 'Disagree'],
            ['value' => 1, 'label' => 'SD', 'description' => 'Strongly Disagree'],
        ];
    }

    /** PART II – 14 items across 5 KRAs. */
    private function performanceKras(): array
    {
        return [
            [
                'code' => 'KRA 1',
                'title' => 'Content Knowledge and Pedagogy',
                'items' => $this->numbered([
                    'Applied knowledge of content within and across curriculum teaching areas.',
                    'Used research-based knowledge and principles of teaching and learning to enhance professional practice.',
                    'Ensured the positive use of ICT to facilitate the teaching and learning process.',
                    'Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills.',
                    'Used effective verbal and non-verbal classroom communication strategies to support learner understanding, participation, and engagement.',
                ]),
            ],
            [
                'code' => 'KRA 2',
                'title' => 'Learning Environment and Diversity of Learners',
                'items' => $this->numbered([
                    'Maintained supportive learning environments that nurture and inspire learners to participate, cooperate and collaborate in continued learning.',
                    'Applied a range of successful strategies that maintain learning environments that motivate learners to work productively by assuming responsibility for their own learning.',
                    'Designed, adapted and implemented teaching strategies that are responsive to learners with disabilities, giftedness and talents.',
                    'Planned and delivered teaching strategies that are responsive to the special educational needs of learners in difficult circumstances, including: geographic isolation; chronic illness; displacement due to armed conflict, urban resettlement or disasters; child abuse and child labor practices.',
                ], 6),
            ],
            [
                'code' => 'KRA 3',
                'title' => 'Curriculum and Planning and Assessment and Reporting',
                'items' => $this->numbered([
                    'Adapted and implemented learning programs that ensure relevance and responsiveness to the needs of all learners.',
                ], 10),
            ],
            [
                'code' => 'KRA 4',
                'title' => 'Community Linkages and Professional Engagement',
                'items' => $this->numbered([
                    'Maintained learning environments that are responsive to community contexts.',
                    'Reviewed regularly personal teaching practice using existing laws and regulations that apply to the teaching profession and the responsibilities specified in the Code of Ethics for Professional Teachers.',
                    'Complied with and implemented school policies and procedures consistently to foster harmonious relationships with learners, parents, and other stakeholders.',
                ], 11),
            ],
            [
                'code' => 'KRA 5',
                'title' => 'Personal Growth and Professional Development',
                'items' => $this->numbered([
                    'Adapted practices that uphold the dignity of teaching as a profession by exhibiting qualities such as a caring attitude, respect, and integrity.',
                ], 14),
            ],
        ];
    }

    /** PART III – 60 items across 5 KRAs (each KRA re-numbered from 1). */
    private function challengeKras(): array
    {
        return [
            [
                'code' => 'KRA 1',
                'title' => 'Content Knowledge and Pedagogy',
                'items' => $this->numbered([
                    'I have a limited understanding of effective teaching strategies and methods.',
                    'I struggle to employ diverse teaching methods to cater to different learning styles and interests, leading to student disengagement.',
                    'I rely heavily on traditional lecture-based instruction, failing to engage students through interactive and participatory learning experiences.',
                    "I struggle in making a meaningful connection between classroom content and real-world applications, diminishing students' interest and relevance in the material.",
                    'I have difficulty in differentiating instructions to meet the needs of diverse learners within the same classroom, including students with special needs.',
                    'I insufficiently differentiate in meeting the needs of diverse learners, resulting in disengagement among my students who require additional support or enrichment.',
                    'I struggle to cater to the diverse needs and learning styles of the students.',
                    'I experience difficulty in updating my subject matter knowledge to keep pace with recent developments and innovations in my field of specialization.',
                    'I have limited confidence in integrating higher-order thinking skills (e.g., critical thinking, problem-solving, and creativity) into my daily lesson delivery.',
                    'I struggle to effectively integrate appropriate instructional technologies and digital resources to enhance content delivery and student engagement.',
                ]),
            ],
            [
                'code' => 'KRA 2',
                'title' => 'Learning Environment and Diversity of Learners',
                'items' => $this->numbered([
                    'I struggle to establish authority in the classroom, leading to disruptions and a lack of respect from students.',
                    'I have difficulty in managing disruptive behavior, including addressing conflicts and maintaining a positive learning environment.',
                    'I have limited knowledge in arranging the physical space and resources inside the classroom in a way that promotes learning and minimizes distractions.',
                    'I have difficulty keeping all students actively engaged in learning activities, leading to disinterest and off-task behavior.',
                    "I have difficulty in establishing a positive classroom environment characterized by enthusiasm, rapport, and mutual respect, which can impact students' motivation and engagement levels.",
                    'I struggle with communication, expectations, directions, and feedback, leading to confusion and disengagement among students.',
                    "I have limited use of technology in my lessons, which may lead to missing opportunities to enhance students' engagement through interactive tools and resources.",
                    'I struggle to understand the diverse needs of students and tailor teaching methods accordingly.',
                    'I encountered difficulty in planning, engaging and effective lessons that cater to the diverse needs of learners.',
                    'I am challenged by cultural differences among my students regarding their background that can lead to misunderstanding their personal norms.',
                    'I hardly understand the languages or dialects of the students, leading to confusion.',
                    'I am affected by the socio-economic disparities among my students that would lead to fewer educational opportunities.',
                    'I encountered different learning styles due to different cultural backgrounds and experiences, requiring teachers to adapt their teaching methods.',
                    'I am challenged with inclusive education, such as disabilities or special needs, requiring teachers to provide inclusive education and support services.',
                    'I experience difficulty in implementing consistent classroom routines and behavioral expectations that promote a safe, inclusive, and learner-centered environment.',
                ]),
            ],
            [
                'code' => 'KRA 3',
                'title' => 'Curriculum and Planning and Assessment and Reporting',
                'items' => $this->numbered([
                    'I find it difficult to align lesson plans with curriculum standards and learning objectives.',
                    'I have limited time to develop detailed lesson plans due to other responsibilities such as grading, meetings, and extra-curricular activities in the school.',
                    'I am inefficient in allocating time to various lesson components.',
                    'I struggle in organizing instructional materials, resources, and classroom activities, resulting in much wasted time.',
                    'I may underestimate the time needed to cover certain topics or activities, resulting in rushed lessons and incomplete learning objectives.',
                    'I am inefficient in lesson preparation due to spending excessive time planning lessons, which may lead to struggles in prioritizing tasks and allocating time effectively.',
                    'I have limited access to teaching materials and technology in the portals of reference.',
                    "I encountered difficulty in incorporating assessments effectively into lesson plans to gauge students' understanding.",
                    'I have a limited use of formative assessment strategies to gauge student understanding and adjust instruction, accordingly, resulting in missed opportunities for engagement and progress monitoring.',
                    'I struggle to design, select, and implement diagnostic, formative, and summative assessment strategies consistent with curriculum requirements.',
                    'I have difficulty monitoring and evaluating learner progress and achievement using learner attainment data.',
                    'I have difficulty providing timely, accurate, and constructive feedback to improve learner performance.',
                    "I struggle to communicate promptly and clearly the learners' needs, progress, and achievement to key stakeholders, including parents/guardians.",
                    'I find it challenging to utilize assessment data to inform the modification of teaching and learning practices and programs.',
                    "I experience difficulty in contextualizing curriculum content and assessment tasks to make them responsive to learners' local context and real-life situations.",
                ]),
            ],
            [
                'code' => 'KRA 4',
                'title' => 'Community Linkages and Professional Engagement',
                'items' => $this->numbered([
                    'I have difficulty seeking guidance and mentorship from experienced colleagues and find it very challenging to collaborate with them while maintaining individual productivity.',
                    'I often face time constraints due to teaching responsibilities, making it challenging to engage in frequent and meaningful communication with parents.',
                    'I have limited communication preferences, such as email, phone calls, or in-person meetings, requiring teachers to accommodate diverse communication styles due to the signal in the school where I am assigned.',
                    'I have less contact with parents in discussing student issues while maintaining privacy or confidentiality and adhering to school policies.',
                    'I have less engagement and collaboration with parents, particularly in meetings and project-initiated activities, and encounter difficulty contacting them for consultation due to work conflicts.',
                    'I struggle in discussing student behavior or academic issues that require sensitivity and effective communication skills from teachers.',
                    "I struggle in building relationships with students' families and the local community with unfamiliar cultural dynamics and community norms.",
                    'I have limited opportunities to engage in school-community partnerships that support student learning and development.',
                    'I encounter challenges in documenting and sustaining collaborative initiatives with parents, colleagues, and community stakeholders.',
                    'I find it challenging to balance professional collaboration with administrative tasks and teaching responsibilities.',
                ]),
            ],
            [
                'code' => 'KRA 5',
                'title' => 'Personal Growth and Professional Development',
                'items' => $this->numbered([
                    'I have been less engaged in regular self-reflection to assess the effectiveness of classroom management strategies.',
                    'I have inadequate reflection on the effectiveness of lesson plans and adjustments for my improvement.',
                    'I have difficulty in prioritizing tasks and allocating time accordingly, focusing on high-impact activities.',
                    'I have less time for regular self-reflection on time management practices and identifying areas for improvement.',
                    'I have difficulty allocating time for professional development to enhance teaching skills and efficiency over time.',
                    'I have difficulty in setting boundaries with my students between work and personal time, leading to burnout and inefficiency in time management.',
                    'I have difficulty in finding the right balance between teaching and responsibilities, and personal time, due to the demands of the profession.',
                    'I experience difficulty in identifying appropriate professional development activities that align with my individual teaching needs and performance goals.',
                    'I have limited opportunities to apply newly acquired knowledge and skills from professional development activities to actual classroom practice.',
                    'I encounter challenges in sustaining motivation and commitment to continuous professional growth amid increasing workload demands.',
                ]),
            ],
        ];
    }

    /** ['text', ...] -> [['no' => n, 'text' => '...'], ...] starting at $start. */
    private function numbered(array $texts, int $start = 1): array
    {
        $out = [];
        foreach (array_values($texts) as $i => $text) {
            $out[] = ['no' => $start + $i, 'text' => $text];
        }

        return $out;
    }
}
