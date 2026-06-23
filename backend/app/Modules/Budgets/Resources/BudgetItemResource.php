<?php

namespace App\Modules\Budgets\Resources;

use App\Modules\Budgets\Models\BudgetItem;
use App\Modules\Products\Resources\GlassTypeResource;
use App\Modules\Products\Resources\ProductColorResource;
use App\Modules\Products\Resources\ProductLineResource;
use App\Modules\Products\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BudgetItem
 */
class BudgetItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'budget_id' => $this->budget_id,
            'product_id' => $this->product_id,
            'product' => new ProductResource($this->whenLoaded('product')),
            'tag' => $this->tag,
            'location' => $this->location,
            'quantity' => $this->quantity,
            'width' => $this->width,
            'height' => $this->height,
            'calculated_area' => $this->calculated_area,
            'weight' => $this->weight,
            'line_id' => $this->line_id,
            'line' => new ProductLineResource($this->whenLoaded('line')),
            'profile_color_id' => $this->profile_color_id,
            'profile_color' => new ProductColorResource($this->whenLoaded('profileColor')),
            'glass_type_id' => $this->glass_type_id,
            'glass_type' => new GlassTypeResource($this->whenLoaded('glassType')),
            'accessory_color_id' => $this->accessory_color_id,
            'accessory_color' => new ProductColorResource($this->whenLoaded('accessoryColor')),
            'unit_price' => $this->unit_price,
            'total' => $this->total,
            'delivery_date' => $this->delivery_date?->format('Y-m-d'),
            'notes' => $this->notes,
            'image_path' => $this->image_path,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
