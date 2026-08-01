<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Product;
use App\Models\ServiceOrder;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Regras comerciais da versão "aperitivo" (trial): 5 OS/mês, 10 clientes,
 * cadastro de peças bloqueado, histórico/relatórios/exportação escondidos.
 */
class TrialLimitsService
{
    public const OS_LIMIT = 5;
    public const CLIENTS_LIMIT = 10;

    /**
     * Situação atual da loja para a UI (cadeados e mensagens).
     */
    public function statusFor(?User $user): array
    {
        if (! $user || $user->isSuperAdmin() || ! $user->store_id) {
            return [
                'is_trial' => false,
                'subscription_status' => null,
                'os_used' => 0,
                'os_limit' => self::OS_LIMIT,
                'clients_used' => 0,
                'clients_limit' => self::CLIENTS_LIMIT,
                'can_create_os' => true,
                'can_create_client' => true,
                'can_create_product' => true,
                'can_see_history' => true,
                'can_export' => true,
                'can_see_financial' => true,
                'trial_limit_at' => null,
            ];
        }

        $store = $user->store;

        if (! $store?->isTrial()) {
            return [
                'is_trial' => false,
                'subscription_status' => $store?->subscription_status->value,
                'os_used' => 0,
                'os_limit' => self::OS_LIMIT,
                'clients_used' => 0,
                'clients_limit' => self::CLIENTS_LIMIT,
                'can_create_os' => true,
                'can_create_client' => true,
                'can_create_product' => true,
                'can_see_history' => true,
                'can_export' => true,
                'can_see_financial' => true,
                'trial_limit_at' => null,
            ];
        }

        $osUsed = ServiceOrder::query()
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $clientsUsed = Client::query()->count();

        return [
            'is_trial' => true,
            'subscription_status' => $store->subscription_status->value,
            'os_used' => $osUsed,
            'os_limit' => self::OS_LIMIT,
            'clients_used' => $clientsUsed,
            'clients_limit' => self::CLIENTS_LIMIT,
            'can_create_os' => $osUsed < self::OS_LIMIT,
            'can_create_client' => $clientsUsed < self::CLIENTS_LIMIT,
            'can_create_product' => false,
            'can_see_history' => false,
            'can_export' => false,
            'can_see_financial' => false,
            'trial_limit_at' => $store->trial_limit_at,
        ];
    }

    /**
     * Bloqueia com 403 quando a loja em trial não pode mais abrir OS no mês.
     */
    public function assertCanCreateServiceOrder(?User $user): void
    {
        $status = $this->statusFor($user);

        if ($status['is_trial'] && ! $status['can_create_os']) {
            $this->abortLimit('Você atingiu o limite de ordens de serviço da versão gratuita (5 por mês).');
        }
    }

    /**
     * Bloqueia com 403 quando a loja em trial não pode mais cadastrar clientes.
     */
    public function assertCanCreateClient(?User $user): void
    {
        $status = $this->statusFor($user);

        if ($status['is_trial'] && ! $status['can_create_client']) {
            $this->abortLimit('Você atingiu o limite de clientes da versão gratuita (10).');
        }
    }

    /**
     * Bloqueia com 403 o cadastro de peças na versão trial.
     */
    public function assertCanCreateProduct(?User $user): void
    {
        $status = $this->statusFor($user);

        if ($status['is_trial'] && ! $status['can_create_product']) {
            $this->abortLimit('O cadastro de peças está disponível apenas no plano completo.');
        }
    }

    /**
     * Bloqueia com 403 o acesso ao financeiro/relatórios na versão trial.
     */
    public function assertCanSeeFinancial(?User $user): void
    {
        $status = $this->statusFor($user);

        if ($status['is_trial'] && ! $status['can_see_financial']) {
            $this->abortLimit('O módulo financeiro está disponível apenas no plano completo.');
        }
    }

    private function abortLimit(string $message): never
    {
        throw new HttpException(403, $message);
    }
}
