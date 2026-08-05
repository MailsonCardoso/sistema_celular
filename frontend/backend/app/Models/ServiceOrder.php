<?php

namespace App\Models;

use App\Enums\ServiceOrderStatus;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceOrder extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = [
        'store_id',
        'os_number',
        'os_number_year',
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
        'discount',
        'total_amount',
        'entry_date',
        'expected_delivery_at',
        'delivery_date',
        'notes',
        'checklist',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceOrderStatus::class,
            'service_cost' => 'decimal:2',
            'discount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'entry_date' => 'date',
            'expected_delivery_at' => 'datetime',
            'delivery_date' => 'date',
            'checklist' => 'array',
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
     * Número estruturado da OS: sequencial por loja e por ano (ex.: 0001/2026).
     */
    protected function osNumberFormatted(): Attribute
    {
        return Attribute::get(fn () => $this->os_number !== null && $this->os_number_year !== null
            ? sprintf('%04d/%d', $this->os_number, $this->os_number_year)
            : null);
    }

    /**
     * Total das peças vinculadas à OS.
     */
    public function partsTotal(): float
    {
        return (float) $this->items->sum(fn ($item) => $item->quantity * $item->unit_price);
    }

    /**
     * Recalcula e persiste o total da OS (mão de obra + peças − desconto).
     */
    public function recalculateTotal(): void
    {
        $base = (float) $this->service_cost + $this->partsTotal();
        $this->total_amount = max(0.0, $base - (float) ($this->discount ?? 0));
        $this->saveQuietly();
    }
}
