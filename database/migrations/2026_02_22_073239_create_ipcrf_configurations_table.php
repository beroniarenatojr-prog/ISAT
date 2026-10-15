<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ipcrf_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('school_year')->unique();
            $table->integer('kra_count')->default(4);
            $table->json('objectives_per_kra')->nullable(); // Store objectives count per KRA
            $table->boolean('is_active')->default(false);
            $table->boolean('is_locked')->default(false); // Prevent changes if records exist
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ipcrf_configurations');
    }
};
