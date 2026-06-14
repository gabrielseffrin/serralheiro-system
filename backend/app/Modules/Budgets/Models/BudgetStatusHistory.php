<?php

namespace App\Modules\Budgets\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BudgetStatusHistory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'budget_status_histories';

    protected $keyType = 'string';

    public $incrementing = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'budget_id',
        'from_status',
        'to_status',
        'changed_by',
        'notes',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function changerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
