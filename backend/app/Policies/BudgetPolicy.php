<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Budgets\Models\Budget;

class BudgetPolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, Budget $budget): bool
    {
        return $this->belongsToSameCompany($user, $budget);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, Budget $budget): bool
    {
        if (! $this->belongsToSameCompany($user, $budget)) {
            return false;
        }

        return $budget->status === 'draft';
    }

    public function delete(User $user, Budget $budget): bool
    {
        if (! $this->belongsToSameCompany($user, $budget)) {
            return false;
        }

        return $budget->status === 'draft';
    }

    public function duplicate(User $user, Budget $budget): bool
    {
        return $this->belongsToSameCompany($user, $budget);
    }

    public function createVersion(User $user, Budget $budget): bool
    {
        return $this->belongsToSameCompany($user, $budget);
    }

    public function changeStatus(User $user, Budget $budget): bool
    {
        return $this->belongsToSameCompany($user, $budget);
    }

    public function downloadPdf(User $user, Budget $budget): bool
    {
        return $this->belongsToSameCompany($user, $budget);
    }
}
