<?php

namespace App\Http\Controllers\Api;

use App\Enums\ServiceOrderStatus;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\FinancialTransaction;
use App\Models\Product;
use App\Models\ServiceOrder;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Indicadores gerais do painel. Na versão trial, apenas os básicos
     * (sem financeiro e sem alertas de estoque).
     */
    public function index(): JsonResponse
    {
        $user = request()->user();
        $isTrial = $user->store_id !== null && $user->store?->isTrial();

        $orderQuery = ServiceOrder::query();
        $incomeQuery = FinancialTransaction::query()->where('type', TransactionType::Income);
        $expenseQuery = FinancialTransaction::query()->where('type', TransactionType::Expense);

        if ($user->isTecnico()) {
            $orderQuery->where('technician_id', $user->id);
        }

        $monthStart = today()->startOfMonth();

        $openOrders = (clone $orderQuery)
            ->whereNotIn('status', [ServiceOrderStatus::Delivered, ServiceOrderStatus::Cancelled])
            ->count();

        $completedThisMonth = (clone $orderQuery)
            ->where('status', ServiceOrderStatus::Completed)
            ->whereDate('updated_at', '>=', $monthStart)
            ->count();

        $activeClients = Client::query()->where('status', 'active')->count();

        $statusCounts = (clone $orderQuery)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $recentOrders = (clone $orderQuery)
            ->with('client:id,name', 'technician:id,name')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (ServiceOrder $order) => [
                'id' => $order->id,
                'client_name' => $order->client?->name,
                'device' => "{$order->device_brand} {$order->device_model}",
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'total_amount' => (float) $order->total_amount,
            ]);

        $data = [
            'open_orders' => $openOrders,
            'completed_this_month' => $completedThisMonth,
            'active_clients' => $activeClients,
            'status_counts' => $statusCounts,
            'recent_orders' => $recentOrders,
            'is_trial' => $isTrial,
        ];

        if (! $isTrial) {
            $monthlyIncome = (float) (clone $incomeQuery)
                ->where('status', TransactionStatus::Paid)
                ->whereDate('paid_date', '>=', $monthStart)
                ->sum('amount');

            $monthlyExpense = (float) (clone $expenseQuery)
                ->where('status', TransactionStatus::Paid)
                ->whereDate('paid_date', '>=', $monthStart)
                ->sum('amount');

            $data += [
                'monthly_income' => $monthlyIncome,
                'monthly_expense' => $monthlyExpense,
                'monthly_balance' => $monthlyIncome - $monthlyExpense,
                'pending_receivables' => (float) (clone $incomeQuery)
                    ->where('status', TransactionStatus::Pending)
                    ->sum('amount'),
                'low_stock_count' => Product::query()
                    ->where('status', 'active')
                    ->whereColumn('stock_quantity', '<=', 'min_stock_quantity')
                    ->count(),
            ];
        }

        return response()->json($data);
    }
}
