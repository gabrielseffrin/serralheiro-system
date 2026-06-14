<?php

namespace App\Modules\Budgets\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => [
                'required',
                'string',
                Rule::exists('customers', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'max:255'],
            'delivery_term' => ['nullable', 'string', 'max:255'],
            'warranty_term' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'sent', 'viewed', 'negotiating', 'approved', 'rejected', 'expired'])],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'string',
                Rule::exists('products', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'items.*.tag' => ['nullable', 'string', 'max:50'],
            'items.*.location' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.width' => ['nullable', 'integer', 'min:0'],
            'items.*.height' => ['nullable', 'integer', 'min:0'],
            'items.*.line_id' => [
                'nullable',
                'string',
                Rule::exists('product_lines', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'items.*.profile_color_id' => [
                'nullable',
                'string',
                Rule::exists('product_colors', 'id')->where('company_id', $this->user()?->company_id)->where('type', 'profile'),
            ],
            'items.*.glass_type_id' => [
                'nullable',
                'string',
                Rule::exists('glass_types', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'items.*.accessory_color_id' => [
                'nullable',
                'string',
                Rule::exists('product_colors', 'id')->where('company_id', $this->user()?->company_id)->where('type', 'accessory'),
            ],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
