<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ipcrf_ratings', function (Blueprint $table) {
            // Add school_year column (mirroring rating_period for consistency)
            $table->string('school_year')->after('rating_period')->nullable();
            
            // Add performance_level column based on numerical rating
            $table->string('performance_level')->after('numerical_rating')->nullable();
        });

        // Update existing records to populate these fields
        DB::table('ipcrf_ratings')->update([
            'school_year' => DB::raw('rating_period')
        ]);
    }

    public function down(): void
    {
        Schema::table('ipcrf_ratings', function (Blueprint $table) {
            $table->dropColumn(['school_year', 'performance_level']);
        });
    }
};
