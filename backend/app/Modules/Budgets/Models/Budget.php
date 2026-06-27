<?php

namespace App\Modules\Budgets\Models;

use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use App\Traits\BelongsToTenant;
use Database\Factories\BudgetFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Budget extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'company_id',
        'customer_id',
        'number',
        'version',
        'parent_budget_id',
        'status',
        'subtotal',
        'discount',
        'total',
        'total_glass_area',
        'total_weight',
        'expiration_date',
        'payment_method',
        'delivery_term',
        'warranty_term',
        'notes',
        'installation_address',
        'public_token',
        'approved_at',
        'approved_ip',
        'rejected_at',
        'rejected_ip',
        'signer_name',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'total_glass_area' => 'decimal:4',
        'total_weight' => 'decimal:3',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BudgetItem::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(BudgetStatusHistory::class);
    }

    public function parentBudget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'parent_budget_id');
    }

    public function childBudgets(): HasMany
    {
        return $this->hasMany(Budget::class, 'parent_budget_id');
    }

    protected static function newFactory()
    {
        return BudgetFactory::new();
    }
}
