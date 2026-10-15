<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kra_id')->constrained()->onDelete('cascade');
            $table->string('code'); // e.g., "1.1.2"
            $table->text('description');
            $table->integer('order')->default(0);
            $table->decimal('weight', 5, 2)->default(7.14); // Weight percentage
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('objectives');
    }
};
