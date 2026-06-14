<?php

namespace App\Modules\Budgets\Models;

use App\Modules\Products\Models\GlassType;
use App\Modules\Products\Models\Product;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Models\ProductLine;
use Database\Factories\BudgetItemFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BudgetItem extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'budget_id',
        'product_id',
        'tag',
        'location',
        'quantity',
        'width',
        'height',
        'calculated_area',
        'line_id',
        'profile_color_id',
        'glass_type_id',
        'accessory_color_id',
        'unit_price',
        'total',
        'delivery_date',
        'notes',
        'image_path',
    ];

    protected $casts = [
        'calculated_area' => 'decimal:4',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
        'delivery_date' => 'date',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(ProductLine::class, 'line_id');
    }

    public function profileColor(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'profile_color_id');
    }

    public function glassType(): BelongsTo
    {
        return $this->belongsTo(GlassType::class, 'glass_type_id');
    }

    public function accessoryColor(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'accessory_color_id');
    }

    protected static function newFactory()
    {
        return BudgetItemFactory::new();
    }
}
