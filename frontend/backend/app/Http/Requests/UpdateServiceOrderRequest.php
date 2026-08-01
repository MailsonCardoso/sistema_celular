<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'technician_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', UserRole::Tecnico->value),
            ],
            'device_brand' => ['sometimes', 'required', 'string', 'max:100'],
            'device_model' => ['sometimes', 'required', 'string', 'max:100'],
            'device_imei' => ['nullable', 'string', 'max:30'],
            'device_password' => ['nullable', 'string', 'max:255'],
            'reported_issue' => ['sometimes', 'required', 'string'],
            'technical_diagnosis' => ['nullable', 'string'],
            'service_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
