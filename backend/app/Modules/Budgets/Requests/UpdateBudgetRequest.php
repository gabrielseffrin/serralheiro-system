<?php

namespace App\Modules\Budgets\Requests;

class UpdateBudgetRequest extends StoreBudgetRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'status_change_notes' => ['nullable', 'string', 'max:500'],
        ]);
    }
}
