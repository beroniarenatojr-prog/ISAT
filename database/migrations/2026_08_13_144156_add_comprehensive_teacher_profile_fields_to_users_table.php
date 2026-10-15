<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Professional Details
            $table->string('employee_id')->nullable()->unique()->after('id');
            $table->string('career_stage')->nullable()->after('current_position_id'); // Beginning, Proficient, Highly Proficient, Distinguished
            $table->string('teacher_status')->nullable()->after('career_stage'); // Regular, Contractual, Part-time
            $table->string('department')->nullable()->after('teacher_status'); // Department/Subject Area
            $table->string('school_campus')->nullable()->after('department'); // School/Campus Assignment
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id',
                'career_stage',
                'teacher_status',
                'department',
                'school_campus',
            ]);
        });
    }
};
