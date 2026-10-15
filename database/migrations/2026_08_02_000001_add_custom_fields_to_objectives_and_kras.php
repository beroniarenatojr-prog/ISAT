<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kras', function (Blueprint $table) {
            // Track which configuration this KRA was created for (null = default system KRAs)
            $table->unsignedBigInteger('ipcrf_configuration_id')->nullable()->after('is_active');
            $table->boolean('is_custom')->default(false)->after('ipcrf_configuration_id');
            
            $table->foreign('ipcrf_configuration_id')
                  ->references('id')
                  ->on('ipcrf_configurations')
                  ->onDelete('cascade');
        });

        Schema::table('objectives', function (Blueprint $table) {
            // Track which configuration this objective was created for (null = default system objectives)
            $table->unsignedBigInteger('ipcrf_configuration_id')->nullable()->after('is_active');
            $table->boolean('is_custom')->default(false)->after('ipcrf_configuration_id');
            
            $table->foreign('ipcrf_configuration_id')
                  ->references('id')
                  ->on('ipcrf_configurations')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('kras', function (Blueprint $table) {
            $table->dropForeign(['ipcrf_configuration_id']);
            $table->dropColumn(['ipcrf_configuration_id', 'is_custom']);
        });

        Schema::table('objectives', function (Blueprint $table) {
            $table->dropForeign(['ipcrf_configuration_id']);
            $table->dropColumn(['ipcrf_configuration_id', 'is_custom']);
        });
    }
};
