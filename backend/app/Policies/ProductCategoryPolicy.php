<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Products\Models\ProductCategory;

class ProductCategoryPolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, ProductCategory $productCategory): bool
    {
        return $this->belongsToSameCompany($user, $productCategory);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, ProductCategory $productCategory): bool
    {
        return $this->belongsToSameCompany($user, $productCategory);
    }

    public function delete(User $user, ProductCategory $productCategory): bool
    {
        return $this->belongsToSameCompany($user, $productCategory);
    }
}
