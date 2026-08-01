<?php

namespace App\Services;

use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\FinancialTransaction;
use App\Models\ServiceOrder;
use Illuminate\Support\Facades\DB;

/**
 * Responsável pela criação das transações financeiras do fluxo de caixa,
 * incluindo a geração automática ao concluir uma ordem de serviço.
 */
class FinancialTransactionService
{
    /**
     * Cria uma transação de entrada pendente com o total da OS
     * (mão de obra + peças) quando ela é marcada como concluída.
     */
    public function createForCompletedOrder(ServiceOrder $order): FinancialTransaction
    {
        return DB::transaction(function () use ($order) {
            return FinancialTransaction::create([
                'client_id' => $order->client_id,
                'service_order_id' => $order->id,
                'description' => "Serviço concluído - {$order->device_brand} {$order->device_model}",
                'type' => TransactionType::Income,
                'category' => TransactionCategory::ServicePayment,
                'amount' => $order->total_amount,
                'payment_method' => null,
                'status' => TransactionStatus::Pending,
                'due_date' => today()->toDateString(),
                'paid_date' => null,
            ]);
        });
    }

    /**
     * Marca como paga a transação pendente vinculada à OS quando ela é
     * entregue ao cliente.
     */
    public function markOrderPaymentAsPaid(ServiceOrder $order): void
    {
        DB::transaction(function () use ($order) {
            FinancialTransaction::query()
                ->where('service_order_id', $order->id)
                ->where('status', TransactionStatus::Pending)
                ->update([
                    'status' => TransactionStatus::Paid,
                    'paid_date' => today()->toDateString(),
                ]);
        });
    }
}
