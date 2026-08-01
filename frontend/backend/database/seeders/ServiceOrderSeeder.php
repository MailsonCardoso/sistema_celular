<?php

namespace Database\Seeders;

use App\Enums\HistoryActionType;
use App\Enums\PaymentMethod;
use App\Enums\ServiceOrderStatus;
use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Client;
use App\Models\FinancialTransaction;
use App\Models\Product;
use App\Models\ServiceHistory;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServiceOrderSeeder extends Seeder
{
    public function run(Store $store, int $osLimit = 8, bool $withExpenses = true): void
    {
        $clients = Client::where('store_id', $store->id)->get();
        $tecnicos = User::where('store_id', $store->id)->where('role', 'tecnico')->get();
        $admin = User::where('store_id', $store->id)->where('role', 'admin')->first() ?? $tecnicos->first();
        $atendente = User::where('store_id', $store->id)->where('role', 'atendente')->first() ?? $admin;

        if ($clients->isEmpty() || $tecnicos->isEmpty()) {
            return;
        }

        $products = Product::where('store_id', $store->id)->get()->keyBy('name');

        $osData = [
            [
                'client' => 0, 'tecnico' => 0, 'days_ago' => 0,
                'brand' => 'Apple', 'model' => 'iPhone 12',
                'imei' => '356938035643809', 'issue' => 'Tela trincada, toque não responde.',
                'diagnosis' => 'Display danificado, necessidade de troca.',
                'status' => ServiceOrderStatus::InProgress,
                'service_cost' => 150.00,
                'items' => ['Display iPhone 12' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Display iPhone 12 x1 (R$ 650,00/un).', 'by' => 'tecnico'],
                ],
            ],
            [
                'client' => 1, 'tecnico' => 1, 'days_ago' => 1,
                'brand' => 'Samsung', 'model' => 'Galaxy S21',
                'imei' => '359768912345678', 'issue' => 'Bateria descarregando rápido e aparelho desligando sozinho.',
                'diagnosis' => 'Bateria com 78% de vida útil restante, substituição recomendada.',
                'status' => ServiceOrderStatus::AwaitingApproval,
                'service_cost' => 80.00,
                'items' => ['Bateria Galaxy S21' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Bateria Galaxy S21 x1 (R$ 250,00/un).', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Em Reparo\' para \'Aguardando Aprovação\'.', 'by' => 'tecnico'],
                ],
            ],
            [
                'client' => 2, 'tecnico' => 0, 'days_ago' => 3,
                'brand' => 'Motorola', 'model' => 'Moto G54',
                'imei' => '359451234567890', 'issue' => 'Não carrega, conector solto.',
                'diagnosis' => null,
                'status' => ServiceOrderStatus::Opened,
                'service_cost' => 0,
                'items' => [],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                ],
            ],
            [
                'client' => 3, 'tecnico' => 1, 'days_ago' => 2,
                'brand' => 'Apple', 'model' => 'iPhone XR',
                'imei' => '359987654321012', 'issue' => 'Desligando com 30% de bateria.',
                'diagnosis' => null,
                'status' => ServiceOrderStatus::AwaitingParts,
                'service_cost' => 60.00,
                'items' => ['Bateria iPhone XR' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Aguardando Peças\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Bateria iPhone XR x1 (R$ 240,00/un).', 'by' => 'tecnico'],
                ],
            ],
            [
                'client' => 4, 'tecnico' => 0, 'days_ago' => 5,
                'brand' => 'Xiaomi', 'model' => 'Redmi Note 11',
                'imei' => '359123456789012', 'issue' => 'Áudio do microfone ruim em chamadas.',
                'diagnosis' => 'Flex de microfone oxidado.',
                'status' => ServiceOrderStatus::InProgress,
                'service_cost' => 70.00,
                'items' => ['Microfone flex Redmi Note 11' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Microfone flex Redmi Note 11 x1 (R$ 95,00/un).', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Em Reparo\' para \'Aguardando Aprovação\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aguardando Aprovação\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                ],
            ],
            [
                'client' => 5, 'tecnico' => 1, 'days_ago' => 8,
                'brand' => 'Samsung', 'model' => 'Galaxy A54',
                'imei' => '359345678901234', 'issue' => 'Queda, tela quebrada.',
                'diagnosis' => 'Tela e carcaça danificadas.',
                'status' => ServiceOrderStatus::Completed,
                'service_cost' => 180.00,
                'items' => ['Tela completa Galaxy A54' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Tela completa Galaxy A54 x1 (R$ 550,00/un).', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Em Reparo\' para \'Concluída\'.', 'by' => 'tecnico'],
                ],
                'paid' => false,
            ],
            [
                'client' => 6, 'tecnico' => 0, 'days_ago' => 12,
                'brand' => 'Apple', 'model' => 'iPhone 13',
                'imei' => '359567890123456', 'issue' => 'Bateria viciada.',
                'diagnosis' => 'Bateria danificada.',
                'status' => ServiceOrderStatus::Delivered,
                'service_cost' => 100.00,
                'items' => ['Bateria iPhone 13' => 1],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Em Reparo\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::PartAdded, 'desc' => 'Peça adicionada: Bateria iPhone 13 x1 (R$ 280,00/un).', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Em Reparo\' para \'Concluída\'.', 'by' => 'tecnico'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Concluída\' para \'Entregue\'.', 'by' => 'atendente'],
                ],
                'paid' => true,
            ],
            [
                'client' => 7, 'tecnico' => 1, 'days_ago' => 15,
                'brand' => 'Apple', 'model' => 'iPhone 13',
                'imei' => '359789012345678', 'issue' => 'Cliente desistiu do reparo.',
                'diagnosis' => null,
                'status' => ServiceOrderStatus::Cancelled,
                'service_cost' => 0,
                'items' => [],
                'history' => [
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Ordem de serviço aberta.', 'by' => 'atendente'],
                    ['type' => HistoryActionType::StatusChange, 'desc' => 'Status alterado de \'Aberta\' para \'Cancelada\'.', 'by' => 'atendente'],
                ],
            ],
        ];

        foreach (array_slice($osData, 0, $osLimit) as $index => $data) {
            $client = $clients[$data['client'] % $clients->count()];
            $tecnico = $tecnicos[$data['tecnico'] % $tecnicos->count()];
            $entryDate = today()->subDays($data['days_ago']);

            $order = ServiceOrder::create([
                'store_id' => $store->id,
                'client_id' => $client->id,
                'technician_id' => $tecnico->id,
                'device_brand' => $data['brand'],
                'device_model' => $data['model'],
                'device_imei' => $data['imei'],
                'device_password' => $index % 2 === 0 ? '1234' : null,
                'reported_issue' => $data['issue'],
                'technical_diagnosis' => $data['diagnosis'],
                'status' => $data['status'],
                'service_cost' => $data['service_cost'],
                'total_amount' => 0,
                'entry_date' => $entryDate,
                'notes' => null,
            ]);

            $total = (float) $data['service_cost'];

            foreach ($data['items'] as $productName => $qty) {
                $product = $products->get($productName);
                if (! $product) {
                    continue;
                }

                ServiceOrderItem::create([
                    'store_id' => $store->id,
                    'service_order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => (float) $product->selling_price,
                ]);

                $total += (float) $product->selling_price * $qty;
            }

            $order->total_amount = $total;
            $order->save();

            foreach ($data['history'] as $entry) {
                $actor = $entry['by'] === 'atendente' ? $atendente : $tecnico;

                ServiceHistory::create([
                    'store_id' => $store->id,
                    'service_order_id' => $order->id,
                    'user_id' => $actor->id,
                    'action_type' => $entry['type'],
                    'description' => $entry['desc'],
                    'old_value' => null,
                    'new_value' => null,
                    'created_at' => $entryDate->addHours($index + 1),
                    'updated_at' => $entryDate->addHours($index + 1),
                ]);
            }

            if ($data['status'] === ServiceOrderStatus::Completed) {
                FinancialTransaction::create([
                    'store_id' => $store->id,
                    'client_id' => $client->id,
                    'service_order_id' => $order->id,
                    'description' => "Serviço concluído - {$data['brand']} {$data['model']}",
                    'type' => TransactionType::Income,
                    'category' => TransactionCategory::ServicePayment,
                    'amount' => $total,
                    'payment_method' => null,
                    'status' => TransactionStatus::Pending,
                    'due_date' => $entryDate,
                    'paid_date' => null,
                ]);
            }

            if ($data['status'] === ServiceOrderStatus::Delivered) {
                FinancialTransaction::create([
                    'store_id' => $store->id,
                    'client_id' => $client->id,
                    'service_order_id' => $order->id,
                    'description' => "Serviço concluído - {$data['brand']} {$data['model']}",
                    'type' => TransactionType::Income,
                    'category' => TransactionCategory::ServicePayment,
                    'amount' => $total,
                    'payment_method' => PaymentMethod::Pix,
                    'status' => TransactionStatus::Paid,
                    'due_date' => $entryDate,
                    'paid_date' => $entryDate,
                ]);
            }
        }

        if ($withExpenses) {
            $this->createExpenses($store);
        }
    }

    /**
     * Algumas despesas de exemplo para o fluxo de caixa.
     */
    private function createExpenses(Store $store): void
    {
        $expenses = [
            ['Aluguel da loja', 1800.00, 15],
            ['Compra de ferramentas de reparo', 350.00, 4],
            ['Conta de energia elétrica', 220.00, 10],
        ];

        foreach ($expenses as [$description, $amount, $daysAgo]) {
            FinancialTransaction::create([
                'store_id' => $store->id,
                'client_id' => null,
                'service_order_id' => null,
                'description' => $description,
                'type' => TransactionType::Expense,
                'category' => TransactionCategory::Expense,
                'amount' => $amount,
                'payment_method' => PaymentMethod::BankTransfer,
                'status' => TransactionStatus::Paid,
                'due_date' => today()->subDays($daysAgo),
                'paid_date' => today()->subDays($daysAgo),
            ]);
        }
    }
}
