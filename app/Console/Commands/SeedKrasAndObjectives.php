<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\KraSeeder;
use App\Models\Kra;
use App\Models\Objective;

class SeedKrasAndObjectives extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ipcrf:seed-kras';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the standard IPCRF KRAs. Objectives are managed in the database, not seeded.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Seeding KRAs...');
        $this->call(KraSeeder::class);

        $this->info('KRAs seeded successfully.');
        $this->line("Total KRAs: " . Kra::count());
        $this->line("Total Objectives (managed in database): " . Objective::count());

        return self::SUCCESS;
    }
}
