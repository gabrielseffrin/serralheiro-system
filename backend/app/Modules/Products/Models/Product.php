<?php

namespace App\Modules\Products\Models;

use App\Modules\Companies\Models\Company;
use App\Traits\BelongsToTenant;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Product extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
        'default_line_id',
        'pricing_type', // fixed | per_m2 | per_meter | per_kg
        'base_price',
        'requires_dimensions',
        'min_width',
        'min_height',
        'active',
        'company_id',
    ];

    protected $casts = [
        'requires_dimensions' => 'boolean',
        'active' => 'boolean',
        'base_price' => 'decimal:4',
        'min_width' => 'integer',
        'min_height' => 'integer',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function defaultLine(): BelongsTo
    {
        return $this->belongsTo(ProductLine::class, 'default_line_id');
    }

    protected static function newFactory()
    {
        return ProductFactory::new();
    }
}
