<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ipcrf_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ipcrf_rating_id')->constrained('ipcrf_ratings')->onDelete('cascade');
            $table->string('school_year');
            $table->json('responses'); // Store survey answers as JSON
            $table->text('comments')->nullable();
            $table->integer('overall_satisfaction')->nullable(); // 1-5 rating
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ipcrf_surveys');
    }
};
