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
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'technician_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', UserRole::Tecnico->value),
            ],
            'device_brand' => ['required', 'string', 'max:100'],
            'device_model' => ['required', 'string', 'max:100'],
            'device_imei' => ['nullable', 'string', 'max:30'],
            'device_password' => ['nullable', 'string', 'max:255'],
            'reported_issue' => ['required', 'string'],
            'technical_diagnosis' => ['nullable', 'string'],
            'service_cost' => ['nullable', 'numeric', 'min:0'],
            'entry_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
