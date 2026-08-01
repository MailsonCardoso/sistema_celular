<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed do banco de desenvolvimento (3 lojas + Super Admin).
     */
    public function run(): void
    {
        $this->call(UserSeeder::class);

        $fullStore = Store::where('email', 'admin@example.com')->firstOrFail();
        $trialFullStore = Store::where('email', 'loja2@example.com')->firstOrFail();

        // Loja demo com acesso completo (dados ricos para desenvolvimento).
        $this->callWith(ClientSeeder::class, ['store' => $fullStore, 'count' => 8]);
        $this->callWith(ProductSeeder::class, ['store' => $fullStore, 'count' => 12]);
        $this->callWith(ServiceOrderSeeder::class, ['store' => $fullStore, 'osLimit' => 8, 'withExpenses' => true]);

        // Loja em trial já no limite (10 clientes, 5 OSs no mês) para testar os 403.
        $this->callWith(ClientSeeder::class, ['store' => $trialFullStore, 'count' => 10]);
        $this->callWith(ProductSeeder::class, ['store' => $trialFullStore, 'count' => 4]);
        $this->callWith(ServiceOrderSeeder::class, ['store' => $trialFullStore, 'osLimit' => 5, 'withExpenses' => false]);
    }
}
