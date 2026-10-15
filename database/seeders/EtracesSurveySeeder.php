<?php

namespace Database\Seeders;

use App\Models\QuestionnaireTemplate;
use Illuminate\Database\Seeder;

/**
 * "Ready for Self-Assessment" - the e-TRACES DMS satisfaction & performance
 * survey shown on the teacher IPCRF page. Seeded as a "flat" questionnaire
 * template (one scale, one list of statements) so the Administrator can edit
 * the questions and scale from Assessment Tools.
 *
 * Re-running refreshes the definition; teacher answers live in
 * teacher_questionnaires.responses.
 */
class EtracesSurveySeeder extends Seeder
{
    public const KEY = 'etraces-self-assessment';

    public function run(): void
    {
        QuestionnaireTemplate::updateOrCreate(
            ['key' => self::KEY],
            [
                'title' => 'e-TRACES: Teachers Level of Satisfaction and Performance',
                'description' => 'Ready for Self-Assessment - rate each statement about the e-TRACES DMS platform.',
                'is_active' => true,
                'structure' => [
                    'kind' => 'flat',
                    'instructions' => 'A series of statements are listed below. Each one describes a situation which '
                        . 'may be related to a certain extent to what you do or feel. Mark the option that best applies '
                        . 'to how often you engaged in the mentioned activity. There is no correct or incorrect answer; '
                        . 'the information you provide will be kept confidential.',
                    'scale' => [
                        ['value' => 5, 'label' => 'VS', 'description' => 'Very Satisfied'],
                        ['value' => 4, 'label' => 'S', 'description' => 'Satisfied'],
                        ['value' => 3, 'label' => 'N', 'description' => 'Neither'],
                        ['value' => 2, 'label' => 'DS', 'description' => 'Dissatisfied'],
                        ['value' => 1, 'label' => 'VD', 'description' => 'Very Dissatisfied'],
                    ],
                    'items' => $this->numbered([
                        'This DMS platform has much that is of interest to me.',
                        'It is easy to move around the platform.',
                        'I can quickly find what I want on e-TRACES.',
                        'e-TRACES helps me monitor my progress.',
                        'It is easy to store, retrieve, and reproduce files using e-TRACES',
                        'The files/documents on e-TRACES are very useful',
                        "I feel in control when I'm using this DMS platform",
                        'This DMS platform is fast when tracing needed documents.',
                        'e-TRACES is useful in producing my portfolio.',
                        'Learning to find my way around this DMS platform is user-friendly',
                        'I like using this DMS platform',
                        'I can easily access documents in the e-TRACES contacts anywhere I am as long as there is internet connectivity',
                        "I feel efficient when I'm using e-TRACES",
                        'The e-TRACES has some simple and attractive features',
                        'Using e-TRACES for the first time is easy to operate and control.',
                        'The e-TRACES enables pleasing and satisfying interaction for the user',
                        'The DMS platform can be used by specified users to achieve specified goals, freedom from risk, and satisfaction in a specified context of use.',
                        'The system can delete, edit, and recover uploaded files.',
                        'The system ensures that data are accessible only to those authorized to have access.',
                        'The system prevents unauthorized access to, or modification of computer, or programs data.',
                        'The system can perform its required functions efficiently while sharing a common environment and resources with other documents or files without a detrimental impact to any other files.',
                        'e-TRACES is indeed useful to me especially when tracing my loss files.',
                        'Using DMS is not a waste of time',
                        'e-TRACES can help me manage my documents/files',
                        'DMS platform is efficient in providing relevant work files even in the needed personnel is distant',
                        'e-TRACES is useful in justifying authenticity of MOVs aligned to IPCR',
                        'the DMS platform made my e-portfolio easier',
                        'Uploaded MOVs can be monitored easily by the rater using e-TRACES',
                        'e-TRACES can serve as devise scheme for peer mentoring, coaching, and evaluation',
                        'e-TRACES help rater and ratees in PMES collaboration and feedbacking.',
                    ]),
                ],
            ]
        );

        $this->command->info('EtracesSurveySeeder: "'.self::KEY.'" template seeded (30 statements).');
    }

    private function numbered(array $texts): array
    {
        $out = [];
        foreach (array_values($texts) as $i => $text) {
            $out[] = ['no' => $i + 1, 'text' => $text];
        }

        return $out;
    }
}
