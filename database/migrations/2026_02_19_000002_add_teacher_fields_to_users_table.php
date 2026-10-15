<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_position_id')->nullable()->constrained('positions')->onDelete('set null')->after('email');
            $table->string('division')->nullable()->after('current_position_id');
            $table->string('teacher_type')->nullable()->after('division');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_position_id']);
            $table->dropColumn(['current_position_id', 'division', 'teacher_type']);
        });
    }
};
