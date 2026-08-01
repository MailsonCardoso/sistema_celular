<?php

namespace Database\Seeders;

use App\Enums\ProductCategory;
use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

/**
 * Adiciona 2 peças de exemplo à loja em trial vazia (loja3@example.com)
 * para testar a tela de estoque no plano trial.
 */
class TrialProductsSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('email', 'loja3@example.com')->firstOrFail();

        $products = [
            [
                'name' => 'Display iPhone 12',
                'description' => 'Display OLED original de reposição para iPhone 12.',
                'category' => ProductCategory::Peca,
                'brand' => 'Apple',
                'cost_price' => 350.00,
                'selling_price' => 650.00,
                'stock_quantity' => 5,
                'min_stock_quantity' => 2,
            ],
            [
                'name' => 'Bateria Galaxy S21',
                'description' => 'Bateria compatível com Samsung Galaxy S21.',
                'category' => ProductCategory::Peca,
                'brand' => 'Samsung',
                'cost_price' => 120.00,
                'selling_price' => 250.00,
                'stock_quantity' => 8,
                'min_stock_quantity' => 3,
            ],
        ];

        foreach ($products as $product) {
            $product['status'] = ProductStatus::Active;

            Product::updateOrCreate(
                ['store_id' => $store->id, 'name' => $product['name']],
                ['store_id' => $store->id] + $product,
            );
        }
    }
}
