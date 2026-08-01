<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    use HasFactory;    protected $fillable = [
        'store_name',
        'owner_name',
        'cnpj_cpf',
        'email',
        'phone',
        'address',
        'subscription_status',
        'trial_limit_at',
    ];

    protected function casts(): array
    {
        return [
            'subscription_status' => \App\Enums\SubscriptionStatus::class,
            'trial_limit_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function serviceOrders(): HasMany
    {
        return $this->hasMany(ServiceOrder::class);
    }

    public function isTrial(): bool
    {
        return $this->subscription_status->isTrial();
    }

    public function isFullAccess(): bool
    {
        return $this->subscription_status->isFullAccess();
    }

    /**
     * Trial cujo prazo (trial_limit_at) já venceu.
     */
    public function isTrialOverdue(): bool
    {
        return $this->subscription_status->isTrial()
            && $this->trial_limit_at !== null
            && $this->trial_limit_at->isPast();
    }

    public function isExpired(): bool
    {
        return $this->subscription_status->isExpired() || $this->isTrialOverdue();
    }

    /**
     * Lojas em trial cujo prazo já venceu são tratadas como suspensas
     * até o Super Admin renovar ou liberar o acesso.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('subscription_status', '!=', \App\Enums\SubscriptionStatus::Expired)
            ->where(function (Builder $q) {
                $q->where('subscription_status', '!=', \App\Enums\SubscriptionStatus::TrialActive)
                    ->orWhereNull('trial_limit_at')
                    ->orWhere('trial_limit_at', '>=', now());
            });
    }
}
