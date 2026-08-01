<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;

        return [
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'id')->where('store_id', $storeId)],
            'service_order_id' => ['nullable', 'integer', Rule::exists('service_orders', 'id')->where('store_id', $storeId)],
            'description' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(TransactionType::values())],
            'category' => ['required', Rule::in(TransactionCategory::values())],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['nullable', Rule::in(PaymentMethod::values())],
            'status' => ['nullable', Rule::in(TransactionStatus::values())],
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
        ];
    }
}
