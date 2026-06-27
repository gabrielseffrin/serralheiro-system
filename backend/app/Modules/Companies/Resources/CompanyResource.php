<?php

namespace App\Modules\Companies\Resources;

use App\Modules\Companies\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Company
 */
class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'trade_name' => $this->trade_name,
            'document' => $this->document,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'logo' => $this->logo ? config('app.url').'/storage/'.$this->logo : null,
            'default_notes' => $this->default_notes,
            'default_payment_method' => $this->default_payment_method,
            'default_delivery_term' => $this->default_delivery_term,
            'default_warranty_term' => $this->default_warranty_term,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
