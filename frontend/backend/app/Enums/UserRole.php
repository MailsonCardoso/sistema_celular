<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Tecnico = 'tecnico';
    case Atendente = 'atendente';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Administrador',
            self::Tecnico => 'Técnico',
            self::Atendente => 'Atendente',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
