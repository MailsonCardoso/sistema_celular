<?php

namespace App\Http\Requests;

use App\Enums\SubscriptionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::enum(SubscriptionStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Informe o novo status da loja.',
            'status.Illuminate\Validation\Rules\Enum' => 'Status inválido.',
        ];
    }
}
