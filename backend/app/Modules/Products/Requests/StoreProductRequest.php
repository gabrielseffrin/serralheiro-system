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
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_line_id' => [
                'nullable',
                'string',
                Rule::exists('product_lines', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'pricing_type' => ['required', 'string', Rule::in(['fixed', 'per_m2', 'per_meter', 'per_kg'])],
            'base_price' => ['required', 'numeric', 'min:0'],
            'requires_dimensions' => ['boolean'],
            'min_width' => ['nullable', 'integer', 'min:0'],
            'min_height' => ['nullable', 'integer', 'min:0'],
            'active' => ['boolean'],
        ];
    }
}
