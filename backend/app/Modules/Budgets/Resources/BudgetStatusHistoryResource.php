<?php

namespace App\Modules\Budgets\Resources;

use App\Modules\Budgets\Models\BudgetStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BudgetStatusHistory
 */
class BudgetStatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'budget_id' => $this->budget_id,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'changed_by' => $this->changed_by,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
