<?php

namespace App\Providers;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Customers\Models\Customer;
use App\Modules\Products\Models\GlassType;
use App\Modules\Products\Models\Product;
use App\Modules\Products\Models\ProductCategory;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Models\ProductLine;
use App\Policies\BudgetPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\GlassTypePolicy;
use App\Policies\ProductCategoryPolicy;
use App\Policies\ProductColorPolicy;
use App\Policies\ProductLinePolicy;
use App\Policies\ProductPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Customer::class => CustomerPolicy::class,
        Product::class => ProductPolicy::class,
        ProductCategory::class => ProductCategoryPolicy::class,
        ProductLine::class => ProductLinePolicy::class,
        ProductColor::class => ProductColorPolicy::class,
        GlassType::class => GlassTypePolicy::class,
        Budget::class => BudgetPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
