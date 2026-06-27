<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Products\Models\GlassType;

class GlassTypePolicy extends TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function view(User $user, GlassType $glassType): bool
    {
        return $this->belongsToSameCompany($user, $glassType);
    }

    public function create(User $user): bool
    {
        return $user->company_id !== null;
    }

    public function update(User $user, GlassType $glassType): bool
    {
        return $this->belongsToSameCompany($user, $glassType);
    }

    public function delete(User $user, GlassType $glassType): bool
    {
        return $this->belongsToSameCompany($user, $glassType);
    }
}
