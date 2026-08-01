<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStoreStatusRequest;
use App\Http\Resources\StoreResource;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    /**
     * Lista todas as lojas com contagens para o painel do Super Admin.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Store::query()
            ->withCount(['users', 'clients', 'products', 'serviceOrders'])
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $term = '%'.trim($request->string('search')).'%';
            $query->where(function ($q) use ($term) {
                $q->where('store_name', 'like', $term)
                    ->orWhere('owner_name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('status')) {
            $query->where('subscription_status', $request->string('status'));
        }

        return StoreResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    /**
     * Libera (full_access), suspende (expired) ou reativa o trial de uma loja.
     */
    public function updateStatus(UpdateStoreStatusRequest $request, Store $store): StoreResource
    {
        $newStatus = SubscriptionStatus::from($request->status);

        $status = DB::transaction(function () use ($request, $store, $newStatus) {
            if ($newStatus->isFullAccess() && $store->isExpired()) {
                // Reativação: usuários voltam a poder logar.
                $store->users()->update(['is_active' => true]);
            }

            $store->update([
                'subscription_status' => $newStatus,
                'trial_limit_at' => $newStatus->isTrial()
                    ? now()->addDays(30)
                    : $store->trial_limit_at,
            ]);

            return $store->subscription_status->label();
        });

        return (new StoreResource($store->loadCount([
            'users', 'clients', 'products', 'serviceOrders',
        ])))->additional(['message' => "Loja atualizada para \"{$status}\"."]);
    }

    /**
     * Exclui a loja e todos os dados vinculados (clientes, OSs, estoque,
     * financeiro, histórico e usuários). Tudo em uma única transação.
     */
    public function destroy(Store $store): JsonResponse
    {
        $storeName = $store->store_name;

        DB::transaction(function () use ($store) {
            $userIds = $store->users()->pluck('id');
            $orderIds = $store->serviceOrders()->pluck('id');

            $store->financialTransactions()->delete();
            $store->serviceOrderItems()->delete();
            $store->serviceHistory()->delete();
            $store->serviceOrders()->delete();
            $store->clients()->delete();
            $store->products()->delete();

            DB::table('sessions')->whereIn('user_id', $userIds)->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->whereIn('tokenable_id', $userIds)
                ->delete();

            $store->users()->delete();
            $store->delete();
        });

        return response()->json(['message' => "Loja \"{$storeName}\" e todos os seus dados foram excluídos."]);
    }
}
