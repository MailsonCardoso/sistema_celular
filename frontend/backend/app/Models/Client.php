<?php

namespace App\Models;

use App\Enums\ClientStatus;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = [
        'store_id',
        'name',
        'cpf_cnpj',
        'email',
        'phone',
        'address',
        'status',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClientStatus::class,
        ];
    }

    /**
     * Todas as ordens de serviço do cliente.
     */
    public function serviceOrders(): HasMany
    {
        return $this->hasMany(ServiceOrder::class);
    }

    /**
     * Todas as transações financeiras do cliente.
     */
    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }
}
