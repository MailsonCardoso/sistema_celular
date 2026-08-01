<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category?->value,
            'category_label' => $this->category?->label(),
            'brand' => $this->brand,
            'cost_price' => (float) $this->cost_price,
            'selling_price' => (float) $this->selling_price,
            'stock_quantity' => $this->stock_quantity,
            'min_stock_quantity' => $this->min_stock_quantity,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'image_url' => $this->image_url,
            'is_low_stock' => $this->isLowStock(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
