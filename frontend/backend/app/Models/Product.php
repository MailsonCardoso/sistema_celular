<?php

namespace App\Models;

use App\Enums\ProductCategory;
use App\Enums\ProductStatus;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = [
        'store_id',
        'name',
        'description',
        'category',
        'brand',
        'cost_price',
        'selling_price',
        'stock_quantity',
        'min_stock_quantity',
        'status',
        'image_url',
    ];

    protected $attributes = [
        'status' => 'active',
        'stock_quantity' => 0,
        'min_stock_quantity' => 0,
        'cost_price' => 0,
    ];

    protected function casts(): array
    {
        return [
            'category' => ProductCategory::class,
            'status' => ProductStatus::class,
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
        ];
    }

    /**
     * Itens de OS em que esta peça foi utilizada.
     */
    public function serviceOrderItems(): HasMany
    {
        return $this->hasMany(ServiceOrderItem::class);
    }

    /**
     * Estoque abaixo do mínimo (alerta visual no estoque).
     */
    public function isLowStock(): bool
    {
        return $this->status === ProductStatus::Active
            && $this->min_stock_quantity > 0
            && $this->stock_quantity <= $this->min_stock_quantity;
    }
}
