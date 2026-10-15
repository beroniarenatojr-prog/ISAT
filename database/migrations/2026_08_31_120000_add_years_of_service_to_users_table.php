<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Manual override for years of service. When null, the profile page
            // falls back to computing it from date_hired.
            $table->unsignedSmallInteger('years_of_service')->nullable()->after('date_hired');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('years_of_service');
        });
    }
};
