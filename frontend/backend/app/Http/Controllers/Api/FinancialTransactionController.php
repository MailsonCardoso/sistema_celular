<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\ProductCategory;
use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinancialTransactionRequest;
use App\Http\Requests\UpdateFinancialTransactionRequest;
use App\Http\Resources\FinancialTransactionResource;
use App\Models\FinancialTransaction;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpException;

class FinancialTransactionController extends Controller
{
    /**
     * Lista transações com filtros (tipo, status, categoria, período).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = FinancialTransaction::query()
            ->with('client:id,name')
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('due_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('due_date', '<=', $request->date('date_to'));
        }

        return FinancialTransactionResource::collection(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    /**
     * Venda avulsa de um acessório (debita o estoque e cria a entrada financeira).
     */
    public function sale(Request $request): FinancialTransactionResource
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where('status', 'active'),
            ],
            'quantity' => ['required', 'integer', 'min:1'],
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'id')],
            'payment_method' => ['nullable', Rule::in(PaymentMethod::values())],
            'status' => ['nullable', Rule::in(TransactionStatus::values())],
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $product = Product::query()->findOrFail($validated['product_id']);

        if ($product->category !== ProductCategory::Acessorio || $product->stock_quantity < $validated['quantity']) {
            throw new HttpException(
                422,
                'Produto indisponível: selecione um acessório com estoque suficiente.'
            );
        }

        return DB::transaction(function () use ($product, $validated) {
            $product->decrement('stock_quantity', $validated['quantity']);

            /** @var FinancialTransaction $tx */
            $tx = FinancialTransaction::create([
                'store_id' => $product->store_id,
                'client_id' => $validated['client_id'],
                'description' => trim((string) ($validated['description'] ?? ''))
                    ?: "Venda de acessório: {$product->name}",
                'type' => TransactionType::Income,
                'category' => TransactionCategory::AccessoriesSale,
                'amount' => $product->selling_price * $validated['quantity'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'] ?? TransactionStatus::Pending,
                'due_date' => $validated['due_date'],
                'paid_date' => $validated['paid_date'],
            ]);

            return new FinancialTransactionResource($tx);
        });
    }

    /**
     * Relatório de faturamento por período (entradas, saídas e saldo).
     */
    public function report(Request $request): JsonResponse
    {
        $dateFrom = $request->filled('date_from')
            ? $request->date('date_from')
            : today()->startOfMonth();
        $dateTo = $request->filled('date_to')
            ? $request->date('date_to')
            : today();

        $query = fn ($type) => FinancialTransaction::query()
            ->where('type', $type)
            ->where('status', TransactionStatus::Paid)
            ->whereBetween('due_date', [$dateFrom, $dateTo]);

        $totals = FinancialTransaction::query()
            ->where('status', TransactionStatus::Paid)
            ->whereBetween('due_date', [$dateFrom, $dateTo])
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expense
            ")
            ->first();

        $income = (float) $totals?->income;
        $expense = (float) $totals?->expense;

        $previousBalance = (float) FinancialTransaction::query()
            ->where('status', TransactionStatus::Paid)
            ->whereDate('due_date', '<', $dateFrom)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) -
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as balance
            ")
            ->value('balance');

        return response()->json([
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString(),
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
            'previous_balance' => $previousBalance,
            'accrued_balance' => $previousBalance + $income - $expense,
            'by_category' => [
                'income' => (object) $query(TransactionType::Income)
                    ->selectRaw('category, SUM(amount) as total')
                    ->groupBy('category')
                    ->pluck('total', 'category')
                    ->toArray(),
                'expense' => (object) $query(TransactionType::Expense)
                    ->selectRaw('category, SUM(amount) as total')
                    ->groupBy('category')
                    ->pluck('total', 'category')
                    ->toArray(),
            ],
        ]);
    }

    /**
     * Lança uma nova transação (receita ou despesa manual).
     */
    public function store(StoreFinancialTransactionRequest $request): FinancialTransactionResource
    {
        $transaction = FinancialTransaction::create($request->validated());

        return new FinancialTransactionResource($transaction);
    }

    /**
     * Exibe uma transação.
     */
    public function show(FinancialTransaction $financialTransaction): FinancialTransactionResource
    {
        return new FinancialTransactionResource($financialTransaction->load('client'));
    }

    /**
     * Atualiza a transação (incluindo baixa manual de pagamento).
     */
    public function update(UpdateFinancialTransactionRequest $request, FinancialTransaction $financialTransaction): FinancialTransactionResource
    {
        $financialTransaction->update($request->validated());

        return new FinancialTransactionResource($financialTransaction->load('client'));
    }

    /**
     * Exclui uma transação (apenas admin).
     */
    public function destroy(FinancialTransaction $financialTransaction): JsonResponse
    {
        $financialTransaction->delete();

        return response()->json(['message' => 'Transação excluída com sucesso.']);
    }
}
