<?php

namespace App\Modules\Budgets\Requests;

use App\Modules\Products\Models\Product;
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
            'installation_address' => ['nullable', 'string', 'max:500'],
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
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
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

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $productIds = collect($this->input('items', []))
                ->pluck('product_id')
                ->unique()
                ->filter();

            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($this->input('items', []) as $index => $item) {
                $product = $products->get($item['product_id'] ?? null);
                if (! $product) {
                    continue;
                }

                $needsDims = $product->requires_dimensions
                    || in_array($product->pricing_type, ['per_m2', 'per_meter']);

                $needsWeight = $product->pricing_type === 'per_kg';

                if ($needsDims) {
                    if (empty($item['width']) || (int) $item['width'] <= 0) {
                        $validator->errors()->add(
                            "items.{$index}.width",
                            "Largura é obrigatória para '{$product->name}'."
                        );
                    }
                    if (empty($item['height']) || (int) $item['height'] <= 0) {
                        $validator->errors()->add(
                            "items.{$index}.height",
                            "Altura é obrigatória para '{$product->name}'."
                        );
                    }
                }

                if ($needsWeight && (empty($item['weight']) || (float) $item['weight'] <= 0)) {
                    $validator->errors()->add(
                        "items.{$index}.weight",
                        "Peso é obrigatório para '{$product->name}' (precificação por kg)."
                    );
                }

                if ($product->min_width !== null && ! empty($item['width']) && (int) $item['width'] < $product->min_width) {
                    $validator->errors()->add(
                        "items.{$index}.width",
                        "Largura mínima para '{$product->name}' é {$product->min_width}mm."
                    );
                }

                if ($product->max_width !== null && ! empty($item['width']) && (int) $item['width'] > $product->max_width) {
                    $validator->errors()->add(
                        "items.{$index}.width",
                        "Largura máxima para '{$product->name}' é {$product->max_width}mm."
                    );
                }

                if ($product->min_height !== null && ! empty($item['height']) && (int) $item['height'] < $product->min_height) {
                    $validator->errors()->add(
                        "items.{$index}.height",
                        "Altura mínima para '{$product->name}' é {$product->min_height}mm."
                    );
                }

                if ($product->max_height !== null && ! empty($item['height']) && (int) $item['height'] > $product->max_height) {
                    $validator->errors()->add(
                        "items.{$index}.height",
                        "Altura máxima para '{$product->name}' é {$product->max_height}mm."
                    );
                }
            }
        });
    }
}
