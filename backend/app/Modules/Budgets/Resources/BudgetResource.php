<?php

namespace App\Modules\Budgets\Resources;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Companies\Resources\CompanyResource;
use App\Modules\Customers\Resources\CustomerResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Budget
 */
class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'number' => $this->number,
            'number_formatted' => '#'.str_pad((string) $this->number, 6, '0', STR_PAD_LEFT),
            'version' => $this->version,
            'parent_budget_id' => $this->parent_budget_id,
            'parent_budget' => new self($this->whenLoaded('parentBudget')),
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'total' => $this->total,
            'expiration_date' => $this->expiration_date?->format('Y-m-d'),
            'payment_method' => $this->payment_method,
            'delivery_term' => $this->delivery_term,
            'warranty_term' => $this->warranty_term,
            'notes' => $this->notes,
            'public_token' => $this->public_token,
            'items_count' => $this->whenCounted('items'),
            'items' => BudgetItemResource::collection($this->whenLoaded('items')),
            'status_histories' => BudgetStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
