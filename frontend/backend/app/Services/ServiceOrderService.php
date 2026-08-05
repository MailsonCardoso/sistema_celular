<?php

namespace App\Services;

use App\Enums\HistoryActionType;
use App\Enums\ServiceOrderStatus;
use App\Models\Product;
use App\Models\ServiceHistory;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Serviço central das Ordens de Serviço: orquestra a criação, o consumo de
 * estoque, o histórico de auditoria e a geração de transações financeiras.
 */
class ServiceOrderService
{
    /**
     * Transições de status permitidas (fluxo da assistência técnica).
     */
    private const TRANSITIONS = [
        'opened' => ['in_progress', 'awaiting_parts', 'awaiting_approval', 'completed', 'cancelled'],
        'awaiting_parts' => ['in_progress', 'completed', 'cancelled'],
        'in_progress' => ['awaiting_parts', 'awaiting_approval', 'completed', 'cancelled'],
        'awaiting_approval' => ['in_progress', 'awaiting_parts', 'completed', 'cancelled'],
        'completed' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function __construct(
        private readonly FinancialTransactionService $financialTransactions,
    ) {}

    /**
     * Cria uma nova OS, registrando o status inicial no histórico.
     */
    public function create(array $data, User $actor): ServiceOrder
    {
        $data['status'] = ServiceOrderStatus::Opened;
        $data['entry_date'] ??= today()->toDateString();

        $order = DB::transaction(function () use ($data, $actor) {
            $year = (int) substr($data['entry_date'], 0, 4);

            $lastNumber = ServiceOrder::query()
                ->where('store_id', $actor->store_id)
                ->where('os_number_year', $year)
                ->lockForUpdate()
                ->orderByDesc('os_number')
                ->value('os_number');

            $data['os_number'] = ($lastNumber ?? 0) + 1;
            $data['os_number_year'] = $year;

            $order = ServiceOrder::create($data);

            $this->assertDiscountValid($order);
            $order->recalculateTotal();

            $this->recordHistory(
                $order,
                $actor,
                HistoryActionType::StatusChange,
                'Ordem de serviço aberta.',
                null,
                ServiceOrderStatus::Opened->value,
            );

            return $order;
        });

        $order->load('client', 'technician', 'items.product', 'history.user');

        return $order;
    }

    /**
     * Atualiza dados da OS. Se o custo de mão de obra mudar, recalcula o
     * total e registra o histórico correspondente.
     */
    public function update(ServiceOrder $order, array $data, User $actor): ServiceOrder
    {
        return DB::transaction(function () use ($order, $data, $actor) {
            $this->assertOrderEditable($order);

            $oldServiceCost = (float) $order->service_cost;

            $order->fill($data);

            $this->assertDiscountValid($order);

            if (isset($data['service_cost']) && (float) $data['service_cost'] !== $oldServiceCost) {
                $this->recordHistory(
                    $order,
                    $actor,
                    HistoryActionType::CostUpdate,
                    'Custo de mão de obra atualizado.',
                    number_format($oldServiceCost, 2, ',', '.'),
                    number_format((float) $data['service_cost'], 2, ',', '.'),
                );
            }

            $order->save();
            $order->recalculateTotal();

            if ($order->status === ServiceOrderStatus::Completed) {
                $this->financialTransactions->syncCompletedOrderTotal($order);
            }

            return $order;
        });
    }

    /**
     * Vincula uma peça à OS: baixa o estoque, adiciona o item (ou incrementa
     * a quantidade) e registra a ação no histórico.
     */
    public function addItem(ServiceOrder $order, int $productId, int $quantity, ?float $unitPrice, User $actor): ServiceOrderItem
    {
        return DB::transaction(function () use ($order, $productId, $quantity, $unitPrice, $actor) {
            $this->assertOrderEditable($order);

            $product = Product::query()->lockForUpdate()->findOrFail($productId);

            if ($product->status->value !== 'active') {
                throw new RuntimeException("A peça '{$product->name}' está inativa.");
            }

            if ($product->stock_quantity < $quantity) {
                throw new RuntimeException(
                    "Estoque insuficiente para '{$product->name}': disponível {$product->stock_quantity}, solicitado {$quantity}."
                );
            }

            $price = $unitPrice ?? (float) $product->selling_price;

            $item = ServiceOrderItem::query()
                ->where('service_order_id', $order->id)
                ->where('product_id', $product->id)
                ->first();

            if ($item) {
                $item->increment('quantity', $quantity);
                $item->unit_price = $price;
                $item->save();
            } else {
                $item = $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $price,
                ]);
            }

            $product->decrement('stock_quantity', $quantity);

            $this->recordHistory(
                $order,
                $actor,
                HistoryActionType::PartAdded,
                "Peça adicionada: {$product->name} x{$quantity} "
                    . '(R$ ' . number_format($price, 2, ',', '.') . '/un).',
                null,
                "{$product->name} x{$quantity}",
            );

            $this->assertDiscountValid($order);

            $order->recalculateTotal();

            if ($order->status === ServiceOrderStatus::Completed) {
                $this->financialTransactions->syncCompletedOrderTotal($order);
            }

            return $item->load('product');
        });
    }

    /**
     * Remove uma peça da OS, devolvendo a quantidade ao estoque.
     */
    public function removeItem(ServiceOrder $order, ServiceOrderItem $item, User $actor): void
    {
        DB::transaction(function () use ($order, $item, $actor) {
            $this->assertOrderEditable($order);

            $productName = $item->product?->name ?? "Produto #{$item->product_id}";

            Product::whereKey($item->product_id)->increment('stock_quantity', $item->quantity);

            $item->delete();

            $this->recordHistory(
                $order,
                $actor,
                HistoryActionType::PartAdded,
                "Peça removida da OS: {$productName} x{$item->quantity} (estoque devolvido).",
                "{$productName} x{$item->quantity}",
                null,
            );

            $this->assertDiscountValid($order);

            $order->recalculateTotal();

            if ($order->status === ServiceOrderStatus::Completed) {
                $this->financialTransactions->syncCompletedOrderTotal($order);
            }
        });
    }

    /**
     * Altera o status da OS validando a transição. Ao concluir (completed),
     * gera automaticamente a transação financeira pendente com o total da OS.
     * Ao entregar (delivered), marca a transação como paga.
     */
    public function updateStatus(ServiceOrder $order, ServiceOrderStatus $newStatus, ?string $comment, User $actor): ServiceOrder
    {
        return DB::transaction(function () use ($order, $newStatus, $comment, $actor) {
            $oldStatus = $order->status;

            if ($oldStatus === $newStatus) {
                throw new RuntimeException('A OS já está neste status.');
            }

            if (! in_array($newStatus->value, self::TRANSITIONS[$oldStatus->value] ?? [], true)) {
                throw new RuntimeException(
                    "Transição inválida de '{$oldStatus->label()}' para '{$newStatus->label()}'."
                );
            }

            $order->status = $newStatus;
            $order->save();

            $description = $comment
                ? "Status alterado de '{$oldStatus->label()}' para '{$newStatus->label()}'. {$comment}"
                : "Status alterado de '{$oldStatus->label()}' para '{$newStatus->label()}'.";

            $this->recordHistory(
                $order,
                $actor,
                HistoryActionType::StatusChange,
                $description,
                $oldStatus->value,
                $newStatus->value,
            );

            if ($newStatus === ServiceOrderStatus::Completed) {
                $this->financialTransactions->createForCompletedOrder($order);
            }

            if ($newStatus === ServiceOrderStatus::Delivered) {
                $this->financialTransactions->markOrderPaymentAsPaid($order);
            }

            return $order;
        });
    }

    /**
     * Adiciona um comentário ao histórico da OS.
     */
    public function addComment(ServiceOrder $order, string $comment, User $actor): ServiceHistory
    {
        return $this->recordHistory(
            $order,
            $actor,
            HistoryActionType::Comment,
            $comment,
        );
    }

    /**
     * Remove a OS devolvendo o estoque das peças vinculadas.
     */
    public function delete(ServiceOrder $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                Product::whereKey($item->product_id)->increment('stock_quantity', $item->quantity);
            }

            $order->delete();
        });
    }

    /**
     * Registra uma entrada no histórico de acompanhamento da OS.
     */
    public function recordHistory(
        ServiceOrder $order,
        User $actor,
        HistoryActionType $actionType,
        string $description,
        ?string $oldValue = null,
        ?string $newValue = null,
    ): ServiceHistory {
        return ServiceHistory::create([
            'service_order_id' => $order->id,
            'user_id' => $actor->id,
            'action_type' => $actionType,
            'description' => $description,
            'old_value' => $oldValue,
            'new_value' => $newValue,
        ]);
    }

    /**
     * Bloqueia alterações em OS entregue/cancelada.
     */
    private function assertOrderEditable(ServiceOrder $order): void
    {
        if ($order->status->isTerminal()) {
            $label = strtolower($order->status->label());

            throw new RuntimeException("Não é possível alterar uma OS {$label}.");
        }
    }

    /**
     * Impede que o desconto ultrapasse o valor da OS (mão de obra + peças).
     */
    private function assertDiscountValid(ServiceOrder $order): void
    {
        $base = (float) $order->service_cost + $order->partsTotal();

        if ((float) ($order->discount ?? 0) > $base) {
            throw new RuntimeException('O desconto não pode ser maior que o total da OS.');
        }
    }
}
