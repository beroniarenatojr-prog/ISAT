<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kra_self_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('kra_id')->constrained('kras')->cascadeOnDelete();
            $table->string('school_year');
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->decimal('self_rating', 4, 2)->nullable(); // teacher's own 1-5 score for the KRA
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['teacher_id', 'school_year']);
            $table->index(['kra_id', 'school_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kra_self_ratings');
    }
};
