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
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Beginner, Proficient, Highly Proficient, Distinguished
            $table->foreignId('parent_position_id')->nullable()->constrained('positions')->onDelete('set null');
            $table->integer('order')->unique(); // 1, 2, 3, 4 for hierarchy
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
