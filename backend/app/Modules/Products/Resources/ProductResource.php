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
            'default_line_id' => $this->default_line_id,
            'default_line' => new ProductLineResource($this->whenLoaded('defaultLine')),
            'pricing_type' => $this->pricing_type,
            'base_price' => $this->base_price,
            'requires_dimensions' => $this->requires_dimensions,
            'min_width' => $this->min_width,
            'min_height' => $this->min_height,
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
