<?php

namespace App\Enums;

enum ServiceOrderStatus: string
{
    case Opened = 'opened';
    case AwaitingParts = 'awaiting_parts';
    case InProgress = 'in_progress';
    case AwaitingApproval = 'awaiting_approval';
    case Completed = 'completed';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Opened => 'Aberta',
            self::AwaitingParts => 'Aguardando Peças',
            self::InProgress => 'Em Reparo',
            self::AwaitingApproval => 'Aguardando Aprovação',
            self::Completed => 'Concluída',
            self::Delivered => 'Entregue',
            self::Cancelled => 'Cancelada',
        };
    }

    /**
     * Status que representam o fim do ciclo da OS.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
