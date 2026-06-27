<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Products\Models\ProductColor;

class ProductColorPolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, ProductColor $productColor): bool
    {
        return $this->belongsToSameCompany($user, $productColor);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, ProductColor $productColor): bool
    {
        return $this->belongsToSameCompany($user, $productColor);
    }

    public function delete(User $user, ProductColor $productColor): bool
    {
        return $this->belongsToSameCompany($user, $productColor);
    }
}
