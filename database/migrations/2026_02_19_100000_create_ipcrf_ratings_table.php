<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ipcrf_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('rating_period'); // e.g., "2024-2025", "Q1 2024", "Semester 1 2024"
            $table->decimal('numerical_rating', 5, 2)->nullable(); // Average rating (can be up to 100.00)
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
            $table->json('kra_details')->nullable(); // Store KRA ratings as JSON
            $table->decimal('total_score', 6, 2)->nullable(); // Calculated total score (can be up to 9999.99)
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ipcrf_ratings');
    }
};
