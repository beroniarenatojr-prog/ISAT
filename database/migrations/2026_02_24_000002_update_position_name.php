<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Position;

return new class extends Migration
{
    public function up(): void
    {
        // Update the position name from "Beginning towards Proficient" to "Beginning Towards Proficient"
        Position::where('name', 'Beginning towards Proficient')
            ->update(['name' => 'Beginning Towards Proficient']);
        
        // Also handle any variations
        Position::where('name', 'Beginner Towards Proficient')
            ->update(['name' => 'Beginning Towards Proficient']);
    }

    public function down(): void
    {
        // Revert back to original name
        Position::where('name', 'Beginning Towards Proficient')
            ->update(['name' => 'Beginning towards Proficient']);
    }
};