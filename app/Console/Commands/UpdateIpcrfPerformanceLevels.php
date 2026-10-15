<?php

namespace App\Console\Commands;

use App\Models\IpcrfRating;
use Illuminate\Console\Command;

class UpdateIpcrfPerformanceLevels extends Command
{
    protected $signature = 'ipcrf:update-performance-levels';
    protected $description = 'Update performance levels for all existing IPCRF ratings';

    public function handle()
    {
        $this->info('Updating performance levels for existing IPCRF ratings...');

        $ratings = IpcrfRating::whereNotNull('numerical_rating')->get();
        $count = 0;

        foreach ($ratings as $rating) {
            $rating->performance_level = $rating->calculatePerformanceLevel();
            $rating->save();
            $count++;
        }

        $this->info("Successfully updated {$count} IPCRF rating(s).");

        return Command::SUCCESS;
    }
}
