<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_questionnaires', function (Blueprint $table) {
            // Add new fields for simplified survey
            $table->string('sex')->nullable()->after('name');
            $table->string('last_ipcr_rating')->nullable()->after('years_of_service');
            $table->json('responses')->nullable()->after('last_ipcr_rating');
            
            // Change years_of_service to string to allow range values
            $table->string('years_of_service', 50)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('teacher_questionnaires', function (Blueprint $table) {
            $table->dropColumn(['sex', 'last_ipcr_rating', 'responses']);
        });
    }
};
