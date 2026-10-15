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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Teacher being promoted
            $table->foreignId('from_position_id')->nullable()->constrained('positions')->onDelete('set null');
            $table->foreignId('to_position_id')->constrained('positions')->onDelete('cascade');
            $table->foreignId('promoted_by')->constrained('users')->onDelete('cascade'); // Admin who promoted
            $table->timestamp('promoted_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
