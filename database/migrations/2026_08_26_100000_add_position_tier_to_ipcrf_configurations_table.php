<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            // Each school year can now have one configuration per position tier
            // (T1 - T3, T4 - T7, MT1 - MT2, MT3 - MT5)
            $table->string('position_tier')->nullable()->after('school_year');
        });

        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            // Replace the school_year-only unique index with a composite one
            $table->dropUnique('ipcrf_configurations_school_year_unique');
            $table->unique(['school_year', 'position_tier'], 'ipcrf_config_year_tier_unique');
        });
    }

    public function down(): void
    {
        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            $table->dropUnique('ipcrf_config_year_tier_unique');
            $table->unique('school_year', 'ipcrf_configurations_school_year_unique');
        });

        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            $table->dropColumn('position_tier');
        });
    }
};
