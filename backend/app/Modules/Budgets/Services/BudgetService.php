<?php

namespace App\Modules\Budgets\Services;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Models\BudgetItem;
use App\Modules\Products\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BudgetService
{
    /**
     * Create a new budget with items.
     */
    public function create(array $data, array $items, string $companyId, string $userId): Budget
    {
        return DB::transaction(function () use ($data, $items, $companyId, $userId) {
            $number = BudgetNumberGenerator::generate($companyId);
            $publicToken = Str::random(64);
            $initialStatus = $data['status'] ?? 'draft';

            // Create budget
            $budget = Budget::create([
                'company_id' => $companyId,
                'customer_id' => $data['customer_id'],
                'number' => $number,
                'version' => 1,
                'status' => $initialStatus,
                'discount' => $data['discount'] ?? 0.00,
                'expiration_date' => $data['expiration_date'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'delivery_term' => $data['delivery_term'] ?? null,
                'warranty_term' => $data['warranty_term'] ?? null,
                'notes' => $data['notes'] ?? null,
                'public_token' => $publicToken,
            ]);

            // Add items
            foreach ($items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $calculations = BudgetCalculator::calculateItem($itemData, $product);

                $budget->items()->create([
                    'product_id' => $itemData['product_id'],
                    'tag' => $itemData['tag'] ?? null,
                    'location' => $itemData['location'] ?? null,
                    'quantity' => $itemData['quantity'] ?? 1,
                    'width' => $itemData['width'] ?? null,
                    'height' => $itemData['height'] ?? null,
                    'calculated_area' => $calculations['calculated_area'],
                    'weight' => $itemData['weight'] ?? null,
                    'line_id' => $itemData['line_id'] ?? $product->default_line_id,
                    'profile_color_id' => $itemData['profile_color_id'] ?? null,
                    'glass_type_id' => $itemData['glass_type_id'] ?? null,
                    'accessory_color_id' => $itemData['accessory_color_id'] ?? null,
                    'unit_price' => $calculations['unit_price'],
                    'total' => $calculations['total'],
                    'delivery_date' => $itemData['delivery_date'] ?? null,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }

            // Recalculate totals
            $budget->refresh();
            BudgetCalculator::recalculateBudget($budget);

            // Record history log
            $budget->statusHistories()->create([
                'from_status' => null,
                'to_status' => $initialStatus,
                'changed_by' => $userId,
                'notes' => 'Orçamento criado',
            ]);

            return $budget;
        });
    }

    /**
     * Update an existing budget and recreate its items.
     */
    public function update(Budget $budget, array $data, array $items, string $userId): Budget
    {
        return DB::transaction(function () use ($budget, $data, $items, $userId) {
            $oldStatus = $budget->status;
            $newStatus = $data['status'] ?? $budget->status;

            // Update budget
            $budget->update([
                'customer_id' => $data['customer_id'] ?? $budget->customer_id,
                'status' => $newStatus,
                'discount' => $data['discount'] ?? $budget->discount,
                'expiration_date' => $data['expiration_date'] ?? $budget->expiration_date,
                'payment_method' => $data['payment_method'] ?? $budget->payment_method,
                'delivery_term' => $data['delivery_term'] ?? $budget->delivery_term,
                'warranty_term' => $data['warranty_term'] ?? $budget->warranty_term,
                'notes' => $data['notes'] ?? $budget->notes,
            ]);

            // Sync items (delete and recreate)
            $budget->items()->delete();
            foreach ($items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $calculations = BudgetCalculator::calculateItem($itemData, $product);

                $budget->items()->create([
                    'product_id' => $itemData['product_id'],
                    'tag' => $itemData['tag'] ?? null,
                    'location' => $itemData['location'] ?? null,
                    'quantity' => $itemData['quantity'] ?? 1,
                    'width' => $itemData['width'] ?? null,
                    'height' => $itemData['height'] ?? null,
                    'calculated_area' => $calculations['calculated_area'],
                    'weight' => $itemData['weight'] ?? null,
                    'line_id' => $itemData['line_id'] ?? $product->default_line_id,
                    'profile_color_id' => $itemData['profile_color_id'] ?? null,
                    'glass_type_id' => $itemData['glass_type_id'] ?? null,
                    'accessory_color_id' => $itemData['accessory_color_id'] ?? null,
                    'unit_price' => $calculations['unit_price'],
                    'total' => $calculations['total'],
                    'delivery_date' => $itemData['delivery_date'] ?? null,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }

            // Recalculate totals
            $budget->refresh();
            BudgetCalculator::recalculateBudget($budget);

            // Record status change history if changed
            if ($oldStatus !== $newStatus) {
                $budget->statusHistories()->create([
                    'from_status' => $oldStatus,
                    'to_status' => $newStatus,
                    'changed_by' => $userId,
                    'notes' => $data['status_change_notes'] ?? 'Status atualizado durante edição',
                ]);
            }

            return $budget;
        });
    }

    /**
     * Change budget status and log in history.
     */
    public function changeStatus(Budget $budget, string $newStatus, string $userId, ?string $notes = null): Budget
    {
        return DB::transaction(function () use ($budget, $newStatus, $userId, $notes) {
            $oldStatus = $budget->status;

            if ($oldStatus === $newStatus) {
                return $budget;
            }

            $budget->update(['status' => $newStatus]);

            $budget->statusHistories()->create([
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'changed_by' => $userId,
                'notes' => $notes ?? 'Transição de status',
            ]);

            return $budget;
        });
    }

    /**
     * Duplicate a budget as a brand new draft (v1, new number).
     */
    public function duplicate(Budget $budget, string $userId): Budget
    {
        return DB::transaction(function () use ($budget, $userId) {
            $companyId = $budget->company_id;
            $newNumber = BudgetNumberGenerator::generate($companyId);
            $publicToken = Str::random(64);

            // Clone parent model
            $newBudget = Budget::create([
                'company_id' => $companyId,
                'customer_id' => $budget->customer_id,
                'number' => $newNumber,
                'version' => 1,
                'status' => 'draft',
                'subtotal' => $budget->subtotal,
                'discount' => $budget->discount,
                'total' => $budget->total,
                'expiration_date' => $budget->expiration_date,
                'payment_method' => $budget->payment_method,
                'delivery_term' => $budget->delivery_term,
                'warranty_term' => $budget->warranty_term,
                'notes' => $budget->notes,
                'public_token' => $publicToken,
            ]);

            // Clone all items
            foreach ($budget->items as $item) {
                /** @var BudgetItem $item */
                $newBudget->items()->create([
                    'product_id' => $item->product_id,
                    'tag' => $item->tag,
                    'location' => $item->location,
                    'quantity' => $item->quantity,
                    'width' => $item->width,
                    'height' => $item->height,
                    'calculated_area' => $item->calculated_area,
                    'weight' => $item->weight,
                    'line_id' => $item->line_id,
                    'profile_color_id' => $item->profile_color_id,
                    'glass_type_id' => $item->glass_type_id,
                    'accessory_color_id' => $item->accessory_color_id,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                    'delivery_date' => $item->delivery_date,
                    'notes' => $item->notes,
                    'image_path' => $item->image_path,
                ]);
            }

            // Log history
            $newBudget->statusHistories()->create([
                'from_status' => null,
                'to_status' => 'draft',
                'changed_by' => $userId,
                'notes' => "Duplicado a partir do orçamento #{$budget->number}",
            ]);

            return $newBudget;
        });
    }

    /**
     * Create a new version of the budget (same number, incremented version).
     */
    public function createVersion(Budget $budget, string $userId): Budget
    {
        return DB::transaction(function () use ($budget, $userId) {
            $companyId = $budget->company_id;
            $newVersion = $budget->version + 1;
            $publicToken = Str::random(64);

            // Clone parent model
            $newBudget = Budget::create([
                'company_id' => $companyId,
                'customer_id' => $budget->customer_id,
                'number' => $budget->number,
                'version' => $newVersion,
                'parent_budget_id' => $budget->id,
                'status' => 'draft',
                'subtotal' => $budget->subtotal,
                'discount' => $budget->discount,
                'total' => $budget->total,
                'expiration_date' => $budget->expiration_date,
                'payment_method' => $budget->payment_method,
                'delivery_term' => $budget->delivery_term,
                'warranty_term' => $budget->warranty_term,
                'notes' => $budget->notes,
                'public_token' => $publicToken,
            ]);

            // Clone all items
            foreach ($budget->items as $item) {
                /** @var BudgetItem $item */
                $newBudget->items()->create([
                    'product_id' => $item->product_id,
                    'tag' => $item->tag,
                    'location' => $item->location,
                    'quantity' => $item->quantity,
                    'width' => $item->width,
                    'height' => $item->height,
                    'calculated_area' => $item->calculated_area,
                    'weight' => $item->weight,
                    'line_id' => $item->line_id,
                    'profile_color_id' => $item->profile_color_id,
                    'glass_type_id' => $item->glass_type_id,
                    'accessory_color_id' => $item->accessory_color_id,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                    'delivery_date' => $item->delivery_date,
                    'notes' => $item->notes,
                    'image_path' => $item->image_path,
                ]);
            }

            // Log history
            $newBudget->statusHistories()->create([
                'from_status' => null,
                'to_status' => 'draft',
                'changed_by' => $userId,
                'notes' => "Nova versão {$newVersion} criada a partir da versão {$budget->version}",
            ]);

            return $newBudget;
        });
    }

    /**
     * Automatically expire budgets that have reached their expiration date.
     */
    public function expireBudgets(): int
    {
        $expiredCount = 0;

        // Query budgets that are sent, viewed, or negotiating, and have expired
        $budgets = Budget::withoutGlobalScopes()
            ->whereIn('status', ['sent', 'viewed', 'negotiating'])
            ->where('expiration_date', '<', now()->toDateString())
            ->get();

        foreach ($budgets as $budget) {
            $this->changeStatus($budget, 'expired', 'system', 'Orçamento expirado automaticamente por atingir a data limite');
            $expiredCount++;
        }

        return $expiredCount;
    }
}
