<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Products\Models\Product;

class ProductPolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, Product $product): bool
    {
        return $this->belongsToSameCompany($user, $product);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, Product $product): bool
    {
        return $this->belongsToSameCompany($user, $product);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->belongsToSameCompany($user, $product);
    }
}
