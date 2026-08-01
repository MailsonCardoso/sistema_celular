<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransaction extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = [
        'store_id',
        'client_id',
        'service_order_id',
        'description',
        'type',
        'category',
        'amount',
        'payment_method',
        'status',
        'due_date',
        'paid_date',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'category' => TransactionCategory::class,
            'payment_method' => PaymentMethod::class,
            'status' => TransactionStatus::class,
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_date' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function serviceOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class);
    }
}
