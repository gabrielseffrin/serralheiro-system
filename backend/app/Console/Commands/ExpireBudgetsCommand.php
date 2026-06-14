<?php

namespace App\Console\Commands;

use App\Modules\Budgets\Services\BudgetService;
use Illuminate\Console\Command;

class ExpireBudgetsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:expire-budgets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark budgets that passed their expiration date as expired';

    /**
     * Execute the console command.
     */
    public function handle(BudgetService $budgetService): int
    {
        $this->info('Starting budget expiration check...');

        $expiredCount = $budgetService->expireBudgets();

        $this->info("Completed. {$expiredCount} budgets marked as expired.");

        return Command::SUCCESS;
    }
}
