<?php

namespace App\Enums;

enum ProductCategory: string
{
    case Peca = 'peca';
    case Acessorio = 'acessorio';

    public function label(): string
    {
        return match ($this) {
            self::Peca => 'Peça',
            self::Acessorio => 'Acessório',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
