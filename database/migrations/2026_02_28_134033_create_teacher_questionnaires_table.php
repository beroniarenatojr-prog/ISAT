<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('school_year'); // e.g., "2024-2025"
            $table->string('name')->nullable();
            $table->integer('age')->nullable();
            $table->string('teaching_position')->nullable();
            $table->integer('years_of_service')->nullable();
            $table->string('bachelors_degree')->nullable();
            $table->string('year_level_assignment')->nullable();
            $table->string('subject_taught')->nullable();
            $table->text('trainings_attended')->nullable();
            $table->json('kra_ratings')->nullable(); // Store all KRA ratings
            $table->json('challenges')->nullable(); // Store challenge responses
            $table->enum('status', ['draft', 'submitted', 'reviewed'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_questionnaires');
    }
};
