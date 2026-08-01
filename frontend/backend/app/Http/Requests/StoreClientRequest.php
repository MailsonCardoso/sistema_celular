<?php

namespace App\Http\Requests;

use App\Enums\ClientStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'cpf_cnpj' => ['nullable', 'string', 'max:20', 'unique:clients,cpf_cnpj'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(ClientStatus::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do cliente é obrigatório.',
            'cpf_cnpj.unique' => 'Este CPF/CNPJ já está cadastrado.',
            'email.email' => 'Informe um e-mail válido.',
        ];
    }
}
