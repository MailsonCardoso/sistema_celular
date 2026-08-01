<?php

namespace App\Enums;

enum HistoryActionType: string
{
    case StatusChange = 'status_change';
    case Comment = 'comment';
    case PartAdded = 'part_added';
    case CostUpdate = 'cost_update';

    public function label(): string
    {
        return match ($this) {
            self::StatusChange => 'Mudança de Status',
            self::Comment => 'Comentário',
            self::PartAdded => 'Peça Adicionada',
            self::CostUpdate => 'Atualização de Custo',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
