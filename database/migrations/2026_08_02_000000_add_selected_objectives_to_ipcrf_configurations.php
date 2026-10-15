<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            // Store array of selected objective IDs: [1, 2, 3, 4, 5, ...]
            $table->json('selected_objective_ids')->nullable()->after('objectives_per_kra');
        });
    }

    public function down(): void
    {
        Schema::table('ipcrf_configurations', function (Blueprint $table) {
            $table->dropColumn('selected_objective_ids');
        });
    }
};
