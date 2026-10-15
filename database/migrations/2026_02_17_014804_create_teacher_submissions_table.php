<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('objective_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('competency_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('file_path')->nullable(); // PDF file path
            $table->text('notes')->nullable();
            $table->integer('rating')->nullable(); // Rating from admin/super-admin
            $table->enum('status', ['pending', 'submitted', 'reviewed'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('feedback')->nullable();
            $table->string('school_year'); // e.g., "2024-2025"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_submissions');
    }
};
