<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\FinancialTransactionResource;
use App\Http\Resources\ServiceOrderResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    /**
     * Lista clientes com busca e filtro por status.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Client::query()
            ->withCount('serviceOrders')
            ->orderBy('name');

        if ($request->filled('search')) {
            $search = trim($request->string('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('cpf_cnpj', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return ClientResource::collection(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    /**
     * Opções compactas para selects do frontend.
     */
    public function options(Request $request): AnonymousResourceCollection
    {
        $query = Client::query()
            ->where('status', 'active')
            ->orderBy('name');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.trim($request->string('search')).'%');
        }

        return ClientResource::collection($query->limit(50)->get());
    }

    /**
     * Cadastra um novo cliente.
     */
    public function store(StoreClientRequest $request): ClientResource
    {
        $client = Client::create($request->validated());

        return new ClientResource($client);
    }

    /**
     * Detalhes do cliente com histórico de OSs e financeiro.
     */
    public function show(Request $request, Client $client): JsonResponse
    {
        $client->loadCount('serviceOrders');

        $showFinancial = $request->user()->isSuperAdmin()
            || ! $request->user()->store?->isTrial();

        return response()->json([
            'client' => new ClientResource($client),
            'service_orders' => ServiceOrderResource::collection(
                $client->serviceOrders()
                    ->with('technician:id,name', 'items.product:id,name')
                    ->latest()
                    ->limit(20)
                    ->get()
            ),
            'financial_transactions' => $showFinancial
                ? FinancialTransactionResource::collection(
                    $client->financialTransactions()->latest()->limit(20)->get()
                )
                : FinancialTransactionResource::collection([]),
        ]);
    }

    /**
     * Atualiza os dados do cliente.
     */
    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $client->update($request->validated());

        return new ClientResource($client);
    }

    /**
     * Inativa o cliente (não exclui registros por histórico).
     */
    public function destroy(Client $client): JsonResponse
    {
        $client->update(['status' => 'inactive']);

        return response()->json(['message' => 'Cliente inativado com sucesso.']);
    }
}
