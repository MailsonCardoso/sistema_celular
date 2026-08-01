<?php

namespace Database\Seeders;

use App\Enums\ProductCategory;
use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(Store $store, int $count = 12): void
    {
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
            [
                'name' => 'Conector de carga Motorola G54',
                'description' => 'Conector flex com placa de carga.',
                'category' => ProductCategory::Peca,
                'brand' => 'Motorola',
                'cost_price' => 45.00,
                'selling_price' => 110.00,
                'stock_quantity' => 12,
                'min_stock_quantity' => 4,
            ],
            [
                'name' => 'Vidro traseiro iPhone 13',
                'description' => 'Vidro traseiro para iPhone 13.',
                'category' => ProductCategory::Peca,
                'brand' => 'Apple',
                'cost_price' => 90.00,
                'selling_price' => 220.00,
                'stock_quantity' => 3,
                'min_stock_quantity' => 2,
            ],
            [
                'name' => 'Bateria iPhone XR',
                'description' => 'Bateria compatível com iPhone XR.',
                'category' => ProductCategory::Peca,
                'brand' => 'Apple',
                'cost_price' => 110.00,
                'selling_price' => 240.00,
                'stock_quantity' => 1,
                'min_stock_quantity' => 2,
            ],
            [
                'name' => 'Carregador Turbo 25W',
                'description' => 'Carregador rápido USB-C 25W original.',
                'category' => ProductCategory::Acessorio,
                'brand' => 'Samsung',
                'cost_price' => 40.00,
                'selling_price' => 99.00,
                'stock_quantity' => 20,
                'min_stock_quantity' => 5,
            ],
            [
                'name' => 'Capa Silicone iPhone 13',
                'description' => 'Capa de silicone para iPhone 13.',
                'category' => ProductCategory::Acessorio,
                'brand' => 'Genérica',
                'cost_price' => 12.00,
                'selling_price' => 39.90,
                'stock_quantity' => 25,
                'min_stock_quantity' => 6,
            ],
            [
                'name' => 'Película de vidro 9H universal',
                'description' => 'Película de vidro temperado 9H universal 6.1".',
                'category' => ProductCategory::Acessorio,
                'brand' => 'Genérica',
                'cost_price' => 5.00,
                'selling_price' => 19.90,
                'stock_quantity' => 40,
                'min_stock_quantity' => 10,
            ],
            [
                'name' => 'Microfone flex Redmi Note 11',
                'description' => 'Flex de microfone para Xiaomi Redmi Note 11.',
                'category' => ProductCategory::Peca,
                'brand' => 'Xiaomi',
                'cost_price' => 35.00,
                'selling_price' => 95.00,
                'stock_quantity' => 2,
                'min_stock_quantity' => 3,
            ],
            [
                'name' => 'Tela completa Galaxy A54',
                'description' => 'Tela completa com moldura e bateria para Galaxy A54.',
                'category' => ProductCategory::Peca,
                'brand' => 'Samsung',
                'cost_price' => 280.00,
                'selling_price' => 550.00,
                'stock_quantity' => 4,
                'min_stock_quantity' => 2,
            ],
            [
                'name' => 'Cabo USB-C para USB-C 1m',
                'description' => 'Cabo de dados USB-C 1 metro.',
                'category' => ProductCategory::Acessorio,
                'brand' => 'Genérica',
                'cost_price' => 8.00,
                'selling_price' => 29.90,
                'stock_quantity' => 30,
                'min_stock_quantity' => 8,
            ],
            [
                'name' => 'Bateria iPhone 13',
                'description' => 'Bateria compatível com iPhone 13.',
                'category' => ProductCategory::Peca,
                'brand' => 'Apple',
                'cost_price' => 130.00,
                'selling_price' => 280.00,
                'stock_quantity' => 0,
                'min_stock_quantity' => 2,
            ],
        ];

        foreach (array_slice($products, 0, $count) as $product) {
            $product['status'] = ProductStatus::Active;

            Product::updateOrCreate(
                ['store_id' => $store->id, 'name' => $product['name']],
                ['store_id' => $store->id] + $product,
            );
        }
    }
}
