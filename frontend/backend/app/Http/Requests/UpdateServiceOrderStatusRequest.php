<?php

namespace App\Http\Requests;

use App\Enums\ServiceOrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(ServiceOrderStatus::values())],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
