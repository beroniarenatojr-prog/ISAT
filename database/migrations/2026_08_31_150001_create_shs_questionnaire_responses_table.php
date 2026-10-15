<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shs_questionnaire_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('questionnaire_template_id')->constrained('questionnaire_templates')->cascadeOnDelete();
            $table->string('school_year');
            $table->json('profile')->nullable();               // PART I answers
            $table->json('trainings')->nullable();             // PART I #8 rows
            $table->json('performance_ratings')->nullable();   // PART II answers
            $table->json('challenge_ratings')->nullable();     // PART III answers
            $table->enum('status', ['draft', 'submitted', 'reviewed'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['teacher_id', 'questionnaire_template_id', 'school_year'], 'shs_qr_teacher_template_year_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shs_questionnaire_responses');
    }
};
