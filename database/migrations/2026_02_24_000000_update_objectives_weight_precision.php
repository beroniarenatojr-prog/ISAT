<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('objectives', function (Blueprint $table) {
            // Change weight column from decimal(5, 2) to decimal(8, 3) for 3 decimal places
            $table->decimal('weight', 8, 3)->default(7.143)->change();
        });
    }

    public function down(): void
    {
        Schema::table('objectives', function (Blueprint $table) {
            // Revert back to decimal(5, 2)
            $table->decimal('weight', 5, 2)->default(7.14)->change();
        });
    }
};