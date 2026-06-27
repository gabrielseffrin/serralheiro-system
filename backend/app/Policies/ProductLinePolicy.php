<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Products\Models\ProductLine;

class ProductLinePolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, ProductLine $productLine): bool
    {
        return $this->belongsToSameCompany($user, $productLine);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, ProductLine $productLine): bool
    {
        return $this->belongsToSameCompany($user, $productLine);
    }

    public function delete(User $user, ProductLine $productLine): bool
    {
        return $this->belongsToSameCompany($user, $productLine);
    }
}
