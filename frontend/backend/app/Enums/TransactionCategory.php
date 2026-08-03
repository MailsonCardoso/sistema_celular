<?php

namespace App\Enums;

enum TransactionCategory: string
{
    case ServicePayment = 'service_payment';
    case PartsPayment = 'parts_payment';
    case AccessoriesSale = 'accessories_sale';
    case Expense = 'expense';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ServicePayment => 'Pagamento de Serviço',
            self::PartsPayment => 'Pagamento de Peças',
            self::AccessoriesSale => 'Venda de Acessórios',
            self::Expense => 'Despesa',
            self::Other => 'Outro',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
