<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStoreStatusRequest;
use App\Http\Resources\StoreResource;
use App\Models\Store;
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
}
