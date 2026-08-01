<?php

namespace App\Models;

use App\Enums\ServiceOrderStatus;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceOrder extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = [
        'store_id',
        'client_id',
        'technician_id',
        'device_brand',
        'device_model',
        'device_imei',
        'device_password',
        'reported_issue',
        'technical_diagnosis',
        'status',
        'service_cost',
        'total_amount',
        'entry_date',
        'delivery_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceOrderStatus::class,
            'service_cost' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'entry_date' => 'date',
            'delivery_date' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ServiceOrderItem::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(ServiceHistory::class)->latest();
    }

    /**
     * Total das peças vinculadas à OS.
     */
    public function partsTotal(): float
    {
        return (float) $this->items->sum(fn ($item) => $item->quantity * $item->unit_price);
    }

    /**
     * Recalcula e persiste o total da OS (mão de obra + peças).
     */
    public function recalculateTotal(): void
    {
        $this->total_amount = (float) $this->service_cost + $this->partsTotal();
        $this->saveQuietly();
    }
}
