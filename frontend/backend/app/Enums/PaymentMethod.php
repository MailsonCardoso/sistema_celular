<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case CreditCard = 'credit_card';
    case DebitCard = 'debit_card';
    case Pix = 'pix';
    case BankTransfer = 'bank_transfer';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Dinheiro',
            self::CreditCard => 'Cartão de Crédito',
            self::DebitCard => 'Cartão de Débito',
            self::Pix => 'Pix',
            self::BankTransfer => 'Transferência Bancária',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
