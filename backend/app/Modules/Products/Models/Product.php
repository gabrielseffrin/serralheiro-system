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
        'code',
        'category_id',
        'image_path',
        'default_line_id',
        'pricing_type',
        'unit',
        'base_price',
        'cost_price',
        'requires_dimensions',
        'min_width',
        'min_height',
        'max_width',
        'max_height',
        'default_weight',
        'default_profile_color_id',
        'default_accessory_color_id',
        'default_glass_type_id',
        'active',
        'company_id',
    ];

    protected $casts = [
        'requires_dimensions' => 'boolean',
        'active' => 'boolean',
        'base_price' => 'decimal:4',
        'cost_price' => 'decimal:4',
        'min_width' => 'integer',
        'min_height' => 'integer',
        'max_width' => 'integer',
        'max_height' => 'integer',
        'default_weight' => 'decimal:3',
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function defaultProfileColor(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'default_profile_color_id');
    }

    public function defaultAccessoryColor(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'default_accessory_color_id');
    }

    public function defaultGlassType(): BelongsTo
    {
        return $this->belongsTo(GlassType::class, 'default_glass_type_id');
    }

    protected static function newFactory()
    {
        return ProductFactory::new();
    }
}
