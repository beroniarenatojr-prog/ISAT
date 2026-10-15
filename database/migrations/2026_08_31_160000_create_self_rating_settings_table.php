<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('self_rating_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_weight', 5, 2)->default(5.00); // % of the overall 100
            $table->boolean('is_active')->default(true);          // show the KRA self-rating upload to teachers
            $table->timestamps();
        });

        DB::table('self_rating_settings')->insert([
            'total_weight' => 5.00,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('self_rating_settings');
    }
};
