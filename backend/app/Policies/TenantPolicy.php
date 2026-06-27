<?php

namespace App\Policies;

use App\Models\User;

class TenantPolicy
{
    protected function belongsToSameCompany(User $user, mixed $model): bool
    {
        return $user->company_id !== null
            && $model->company_id !== null
            && $user->company_id === $model->company_id;
    }
}
