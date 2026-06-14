<?php

namespace App\Modules\Companies\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'default_notes' => ['nullable', 'string'],
            'default_payment_method' => ['nullable', 'string', 'max:255'],
            'default_delivery_term' => ['nullable', 'string', 'max:255'],
            'default_warranty_term' => ['nullable', 'string', 'max:255'],
        ];
    }
}
