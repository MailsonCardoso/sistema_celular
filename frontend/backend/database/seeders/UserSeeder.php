<?php

namespace Database\Seeders;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'admin123';

        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'store_id' => null,
                'password' => Hash::make($password),
                'phone' => '(11) 90000-0000',
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
            ],
        );

        $fullStore = Store::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'store_name' => 'Tech Solutions ME',
                'owner_name' => 'João da Silva',
                'cnpj_cpf' => '12.345.678/0001-90',
                'phone' => '(11) 98765-4321',
                'address' => 'Rua das Flores, 123 - Centro, São Paulo/SP',
                'subscription_status' => SubscriptionStatus::FullAccess,
                'trial_limit_at' => null,
            ],
        );

        $users = [
            ['admin@example.com', 'Administrador', UserRole::Admin, '(11) 90000-0001'],
            ['tecnico@example.com', 'Carlos Técnico', UserRole::Tecnico, '(11) 90000-0002'],
            ['tecnico2@example.com', 'Mariana Reparos', UserRole::Tecnico, '(11) 90000-0003'],
            ['atendente@example.com', 'Joana Atendente', UserRole::Atendente, '(11) 90000-0004'],
        ];

        foreach ($users as [$email, $name, $role, $phone]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'store_id' => $fullStore->id,
                    'password' => Hash::make($password),
                    'phone' => $phone,
                    'role' => $role,
                    'is_active' => true,
                ],
            );
        }

        // Loja em trial já no limite (10 clientes, 5 OSs) para testar os bloqueios.
        $trialFullStore = Store::updateOrCreate(
            ['email' => 'loja2@example.com'],
            [
                'store_name' => 'CellFix Express',
                'owner_name' => 'Fernanda Lima',
                'cnpj_cpf' => '99.888.777/0001-66',
                'phone' => '(11) 98765-1111',
                'address' => 'Av. Paulista, 1500 - Bela Vista, São Paulo/SP',
                'subscription_status' => SubscriptionStatus::TrialActive,
                'trial_limit_at' => now()->addDays(20),
            ],
        );

        User::updateOrCreate(
            ['email' => 'loja2@example.com'],
            [
                'name' => 'Fernanda Lima',
                'store_id' => $trialFullStore->id,
                'password' => Hash::make($password),
                'phone' => '(11) 90000-0005',
                'role' => UserRole::Admin,
                'is_active' => true,
            ],
        );

        User::updateOrCreate(
            ['email' => 'tec2@example.com'],
            [
                'name' => 'Rafael Técnico',
                'store_id' => $trialFullStore->id,
                'password' => Hash::make($password),
                'phone' => '(11) 90000-0006',
                'role' => UserRole::Tecnico,
                'is_active' => true,
            ],
        );

        // Loja em trial vazia (limites não atingidos) para testar cadastros.
        $emptyTrialStore = Store::updateOrCreate(
            ['email' => 'loja3@example.com'],
            [
                'store_name' => 'Aperitivo Cell',
                'owner_name' => 'Roberto Almeida',
                'cnpj_cpf' => '444.555.666-77',
                'phone' => '(11) 98765-2222',
                'address' => 'Rua dos Pinheiros, 150 - Pinheiros, São Paulo/SP',
                'subscription_status' => SubscriptionStatus::TrialActive,
                'trial_limit_at' => now()->addDays(30),
            ],
        );

        User::updateOrCreate(
            ['email' => 'loja3@example.com'],
            [
                'name' => 'Roberto Almeida',
                'store_id' => $emptyTrialStore->id,
                'password' => Hash::make($password),
                'phone' => '(11) 90000-0007',
                'role' => UserRole::Admin,
                'is_active' => true,
            ],
        );

        $this->command?->info(
            'Usuários: superadmin@example.com / admin@example.com / loja2@example.com / loja3@example.com (senha: admin123)'
        );
    }
}
