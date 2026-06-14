<?php

namespace App\Modules\Budgets\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Budgets\Models\Budget;
use App\Modules\Customers\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        // Total stats (filtered by tenant company automatically via global scope)
        $totalBudgets = Budget::count();
        $totalValueOrced = (float) Budget::sum('total');

        // Status counts and values
        $statsByStatusCollection = Budget::select('status', DB::raw('count(*) as count'), DB::raw('sum(total) as value'))
            ->groupBy('status')
            ->get();

        $statsByStatus = [];
        foreach ($statsByStatusCollection as $item) {
            /** @var object $item */
            $statsByStatus[$item->status] = [
                'count' => (int) $item->count,
                'value' => round((float) $item->value, 2),
            ];
        }

        $approvedCount = $statsByStatus['approved']['count'] ?? 0;
        $approvedValue = $statsByStatus['approved']['value'] ?? 0;

        $pendingCount = 0;
        $pendingValue = 0;
        foreach (['draft', 'sent', 'viewed', 'negotiating'] as $status) {
            $pendingCount += $statsByStatus[$status]['count'] ?? 0;
            $pendingValue += $statsByStatus[$status]['value'] ?? 0;
        }

        $conversionRate = $totalBudgets > 0 ? round(($approvedCount / $totalBudgets) * 100, 2) : 0.0;

        // Recent budgets
        $recentBudgets = Budget::with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentFormatted = $recentBudgets->map(function (Budget $budget) {
            /** @var Customer|null $customer */
            $customer = $budget->customer;

            return [
                'id' => $budget->id,
                'number_formatted' => '#'.str_pad((string) $budget->number, 6, '0', STR_PAD_LEFT),
                'version' => $budget->version,
                'customer_name' => $customer?->name,
                'status' => $budget->status,
                'total' => $budget->total,
                'created_at' => $budget->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => [
                'total_count' => $totalBudgets,
                'total_value' => round($totalValueOrced, 2),
                'approved_count' => $approvedCount,
                'approved_value' => round($approvedValue, 2),
                'pending_count' => $pendingCount,
                'pending_value' => round($pendingValue, 2),
                'conversion_rate' => $conversionRate,
                'by_status' => $statsByStatus,
                'recent' => $recentFormatted,
            ],
        ]);
    }
}
