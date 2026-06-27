<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Customers\Models\Customer;

class CustomerPolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, Customer $customer): bool
    {
        return $this->belongsToSameCompany($user, $customer);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, Customer $customer): bool
    {
        return $this->belongsToSameCompany($user, $customer);
    }

    public function delete(User $user, Customer $customer): bool
    {
        return $this->belongsToSameCompany($user, $customer);
    }
}
