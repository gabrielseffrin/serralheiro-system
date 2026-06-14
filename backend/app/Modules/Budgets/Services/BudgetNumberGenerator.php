<?php

namespace App\Modules\Budgets\Services;

use Illuminate\Support\Facades\DB;

class BudgetNumberGenerator
{
    public static function generate(string $companyId): int
    {
        // Lock the company row to serialize sequential generation for this tenant
        DB::table('companies')
            ->where('id', $companyId)
            ->lockForUpdate()
            ->first();

        $max = DB::table('budgets')
            ->where('company_id', $companyId)
            ->max('number');

        return ($max ?? 0) + 1;
    }
}
