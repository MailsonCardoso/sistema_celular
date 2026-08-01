<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'payment_method' => ['nullable', Rule::in(PaymentMethod::values())],
            'status' => ['sometimes', 'required', Rule::in(TransactionStatus::values())],
            'due_date' => ['sometimes', 'required', 'date'],
            'paid_date' => ['nullable', 'date'],
        ];
    }
}
