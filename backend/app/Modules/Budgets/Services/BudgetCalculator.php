<?php

namespace App\Modules\Budgets\Services;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Models\BudgetItem;
use App\Modules\Products\Models\Product;

class BudgetCalculator
{
    /**
     * Calculate values for a single budget item.
     */
    public static function calculateItem(array $itemData, Product $product): array
    {
        $quantity = (int) ($itemData['quantity'] ?? 1);
        $width = isset($itemData['width']) ? (int) $itemData['width'] : null;
        $height = isset($itemData['height']) ? (int) $itemData['height'] : null;
        $basePrice = (float) $product->base_price;

        $calculatedArea = null;
        $unitPrice = 0.00;

        switch ($product->pricing_type) {
            case 'per_m2':
                if ($width && $height) {
                    $calculatedArea = ($width * $height) / 1000000.0; // convert mm2 to m2
                    $unitPrice = $basePrice * $calculatedArea;
                } else {
                    $unitPrice = (float) ($itemData['unit_price'] ?? $basePrice);
                }
                break;

            case 'per_meter':
                if ($width && $height) {
                    // perimeter in meters = 2 * (width + height) / 1000
                    $perimeter = (2 * ($width + $height)) / 1000.0;
                    $unitPrice = $basePrice * $perimeter;
                } else {
                    $unitPrice = (float) ($itemData['unit_price'] ?? $basePrice);
                }
                break;

            case 'per_kg':
                $weight = isset($itemData['weight']) ? (float) $itemData['weight'] : null;
                if ($weight) {
                    $unitPrice = $basePrice * $weight;
                } else {
                    $unitPrice = isset($itemData['unit_price']) ? (float) $itemData['unit_price'] : $basePrice;
                }
                break;

            case 'fixed':
            default:
                // For fixed, unit_price is manually entered or falls back to base_price
                $unitPrice = isset($itemData['unit_price']) ? (float) $itemData['unit_price'] : $basePrice;
                break;
        }

        // Round decimal values
        $unitPrice = round($unitPrice, 4);
        $total = round($unitPrice * $quantity, 2);

        return [
            'unit_price' => $unitPrice,
            'total' => $total,
            'calculated_area' => $calculatedArea ? round($calculatedArea, 4) : null,
        ];
    }

    /**
     * Calculate and update subtotal and total for a Budget model.
     */
    public static function recalculateBudget(Budget $budget): void
    {
        $subtotal = 0.00;

        foreach ($budget->items as $item) {
            /** @var BudgetItem $item */
            $subtotal += (float) $item->total;
        }

        $discount = (float) $budget->discount;
        $total = max(0.00, $subtotal - $discount);

        $budget->update([
            'subtotal' => round($subtotal, 2),
            'total' => round($total, 2),
        ]);
    }
}
