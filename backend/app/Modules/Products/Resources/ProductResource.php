<?php

namespace App\Modules\Products\Resources;

use App\Modules\Products\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'description' => $this->description,
            'code' => $this->code,
            'category_id' => $this->category_id,
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
            'image_path' => $this->image_path,
            'default_line_id' => $this->default_line_id,
            'default_line' => new ProductLineResource($this->whenLoaded('defaultLine')),
            'pricing_type' => $this->pricing_type,
            'unit' => $this->unit,
            'base_price' => $this->base_price,
            'cost_price' => $this->cost_price,
            'requires_dimensions' => $this->requires_dimensions,
            'min_width' => $this->min_width,
            'min_height' => $this->min_height,
            'max_width' => $this->max_width,
            'max_height' => $this->max_height,
            'default_weight' => $this->default_weight,
            'default_profile_color_id' => $this->default_profile_color_id,
            'default_profile_color' => new ProductColorResource($this->whenLoaded('defaultProfileColor')),
            'default_accessory_color_id' => $this->default_accessory_color_id,
            'default_accessory_color' => new ProductColorResource($this->whenLoaded('defaultAccessoryColor')),
            'default_glass_type_id' => $this->default_glass_type_id,
            'default_glass_type' => new GlassTypeResource($this->whenLoaded('defaultGlassType')),
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
