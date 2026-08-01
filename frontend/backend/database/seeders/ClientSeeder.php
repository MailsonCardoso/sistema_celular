<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Store;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(Store $store, int $count = 8): void
    {
        $clients = [
            [
                'name' => 'João da Silva',
                'cpf_cnpj' => '123.456.789-00',
                'email' => 'joao.silva@email.com',
                'phone' => '(11) 98765-4321',
                'address' => 'Rua das Flores, 123 - Centro, São Paulo/SP',
            ],
            [
                'name' => 'Maria Oliveira',
                'cpf_cnpj' => '987.654.321-00',
                'email' => 'maria.oliveira@email.com',
                'phone' => '(11) 97654-3210',
                'address' => 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
            ],
            [
                'name' => 'Tech Solutions ME',
                'cpf_cnpj' => '12.345.678/0001-90',
                'email' => 'contato@techsolutions.com.br',
                'phone' => '(11) 96543-2109',
                'address' => 'Rua do Comércio, 500 - Santo Amaro, São Paulo/SP',
            ],
            [
                'name' => 'Pedro Santos',
                'cpf_cnpj' => '111.222.333-44',
                'email' => 'pedro.santos@email.com',
                'phone' => '(11) 95432-1098',
                'address' => 'Rua das Palmeiras, 45 - Vila Mariana, São Paulo/SP',
            ],
            [
                'name' => 'Ana Costa',
                'cpf_cnpj' => '555.666.777-88',
                'email' => 'ana.costa@email.com',
                'phone' => '(11) 94321-0987',
                'address' => 'Rua Augusta, 890 - Consolação, São Paulo/SP',
            ],
            [
                'name' => 'Fernanda Lima',
                'cpf_cnpj' => '999.888.777-66',
                'email' => 'fernanda.lima@email.com',
                'phone' => '(11) 93210-9876',
                'address' => 'Av. Brigadeiro Faria Lima, 2000 - Pinheiros, São Paulo/SP',
            ],
            [
                'name' => 'Comércio de Eletrônicos LTDA',
                'cpf_cnpj' => '98.765.432/0001-10',
                'email' => 'vendas@comercioeletronicos.com.br',
                'phone' => '(11) 92109-8765',
                'address' => 'Rua 25 de Março, 300 - Centro, São Paulo/SP',
            ],
            [
                'name' => 'Roberto Almeida',
                'cpf_cnpj' => '444.555.666-77',
                'email' => 'roberto.almeida@email.com',
                'phone' => '(11) 91098-7654',
                'address' => 'Rua dos Pinheiros, 150 - Pinheiros, São Paulo/SP',
            ],
        ];

        foreach (array_slice($clients, 0, $count) as $client) {
            Client::updateOrCreate(
                ['store_id' => $store->id, 'cpf_cnpj' => $client['cpf_cnpj']],
                ['store_id' => $store->id] + $client,
            );
        }

        // Clientes adicionais (genéricos) para lojas que precisam de mais.
        for ($i = count($clients); $i < $count; $i++) {
            Client::updateOrCreate(
                ['store_id' => $store->id, 'cpf_cnpj' => "000.000.00{$i}-00"],
                [
                    'store_id' => $store->id,
                    'name' => "Cliente Genérico {$i}",
                    'cpf_cnpj' => "000.000.00{$i}-00",
                    'email' => "cliente{$i}@email.com",
                    'phone' => '(11) 9'.str_pad((string) $i, 7, '0', STR_PAD_LEFT),
                    'address' => 'Endereço do cliente '.$i,
                ],
            );
        }
    }
}
