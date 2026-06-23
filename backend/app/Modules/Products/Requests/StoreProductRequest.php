<?php

namespace App\Modules\Products\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('products', 'code')->where('company_id', $companyId),
            ],
            'category_id' => [
                'nullable',
                'string',
                Rule::exists('product_categories', 'id')->where('company_id', $companyId),
            ],
            'image_path' => ['nullable', 'string', 'max:500'],
            'default_line_id' => [
                'nullable',
                'string',
                Rule::exists('product_lines', 'id')->where('company_id', $companyId),
            ],
            'pricing_type' => ['required', 'string', Rule::in(['fixed', 'per_m2', 'per_meter', 'per_kg'])],
            'unit' => ['required', 'string', Rule::in(['piece', 'm2', 'linear_meter', 'kg', 'pair', 'set'])],
            'base_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'requires_dimensions' => ['boolean'],
            'min_width' => ['nullable', 'integer', 'min:0'],
            'min_height' => ['nullable', 'integer', 'min:0'],
            'max_width' => ['nullable', 'integer', 'min:0', 'gte:min_width'],
            'max_height' => ['nullable', 'integer', 'min:0', 'gte:min_height'],
            'default_weight' => ['nullable', 'numeric', 'min:0'],
            'default_profile_color_id' => [
                'nullable',
                'string',
                Rule::exists('product_colors', 'id')->where('company_id', $companyId)->where('type', 'profile'),
            ],
            'default_accessory_color_id' => [
                'nullable',
                'string',
                Rule::exists('product_colors', 'id')->where('company_id', $companyId)->where('type', 'accessory'),
            ],
            'default_glass_type_id' => [
                'nullable',
                'string',
                Rule::exists('glass_types', 'id')->where('company_id', $companyId),
            ],
            'active' => ['boolean'],
        ];
    }
}
