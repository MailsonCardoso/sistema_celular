<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;

        return [
            'client_id' => ['required', 'integer', Rule::exists('clients', 'id')->where('store_id', $storeId)],
            'technician_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')
                    ->whereIn('role', [UserRole::Tecnico->value, UserRole::Admin->value])
                    ->where('store_id', $storeId),
            ],
            'device_brand' => ['required', 'string', 'max:100'],
            'device_model' => ['required', 'string', 'max:100'],
            'device_imei' => ['nullable', 'string', 'max:30'],
            'device_password' => ['nullable', 'string', 'max:255'],
            'reported_issue' => ['required', 'string'],
            'technical_diagnosis' => ['nullable', 'string'],
            'service_cost' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'entry_date' => ['nullable', 'date'],
            'expected_delivery_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'checklist' => ['nullable', 'array'],
            'checklist.items' => ['array'],
            'checklist.items.*' => ['string', 'max:50'],
            'checklist.condition' => ['array'],
            'checklist.condition.*' => ['string', 'max:50'],
        ];
    }
}
