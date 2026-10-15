<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add position_tiers to kras table
        Schema::table('kras', function (Blueprint $table) {
            // JSON array of position tiers: ["T1 - T3", "T4 - T7", "MT1 - MT2", "MT3 - MT5"]
            // null means available for all positions
            $table->json('position_tiers')->nullable()->after('is_active');
        });

        // Add position_tiers to objectives table
        Schema::table('objectives', function (Blueprint $table) {
            // JSON array of position tiers: ["T1 - T3", "T4 - T7", "MT1 - MT2", "MT3 - MT5"]
            // null means available for all positions
            $table->json('position_tiers')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('kras', function (Blueprint $table) {
            $table->dropColumn('position_tiers');
        });

        Schema::table('objectives', function (Blueprint $table) {
            $table->dropColumn('position_tiers');
        });
    }
};
