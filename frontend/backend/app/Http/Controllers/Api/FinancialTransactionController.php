<?php

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinancialTransactionRequest;
use App\Http\Requests\UpdateFinancialTransactionRequest;
use App\Http\Resources\FinancialTransactionResource;
use App\Models\FinancialTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
