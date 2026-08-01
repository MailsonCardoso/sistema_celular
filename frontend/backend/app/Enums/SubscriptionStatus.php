<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case TrialActive = 'trial_active';
    case FullAccess = 'full_access';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::TrialActive => 'Trial Ativo',
            self::FullAccess => 'Acesso Completo',
            self::Expired => 'Suspensa',
        };
    }

    public function isTrial(): bool
    {
        return $this === self::TrialActive;
    }

    public function isFullAccess(): bool
    {
        return $this === self::FullAccess;
    }

    public function isExpired(): bool
    {
        return $this === self::Expired;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
