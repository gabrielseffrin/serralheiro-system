<?php

namespace App\Modules\Companies\Models;

use App\Models\User;
use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'trade_name',
        'document',
        'phone',
        'email',
        'address',
        'logo',
        'default_notes',
        'default_payment_method',
        'default_delivery_term',
        'default_warranty_term',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    protected static function newFactory()
    {
        return CompanyFactory::new();
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
