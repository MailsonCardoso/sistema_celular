<?php

namespace App\Http\Controllers\Api;

use App\Enums\ServiceOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddServiceOrderCommentRequest;
use App\Http\Requests\AddServiceOrderItemRequest;
use App\Http\Requests\StoreServiceOrderRequest;
use App\Http\Requests\UpdateServiceOrderRequest;
use App\Http\Requests\UpdateServiceOrderStatusRequest;
use App\Http\Resources\ServiceHistoryResource;
use App\Http\Resources\ServiceOrderItemResource;
use App\Http\Resources\ServiceOrderResource;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Services\ServiceOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class ServiceOrderController extends Controller
{
    public function __construct(
        private readonly ServiceOrderService $service,
    ) {}

    /**
     * Lista as OSs com filtros (status, cliente, técnico, período).
     * Técnicos enxergam apenas as OSs atribuídas a eles.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ServiceOrder::query()
            ->with(['client:id,name,phone', 'technician:id,name'])
            ->withCount('items');

        if ($request->user()->isTecnico()) {
            $query->where('technician_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));

            $query->where(function ($q) use ($search) {
                $q->where('device_brand', 'like', "%{$search}%")
                    ->orWhere('device_model', 'like', "%{$search}%")
                    ->orWhere('device_imei', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('technician_id') && $request->user()->isAdmin()) {
            $query->where('technician_id', $request->integer('technician_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('entry_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('entry_date', '<=', $request->date('date_to'));
        }

        $orders = $query->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return ServiceOrderResource::collection($orders);
    }

    /**
     * Lista as OSs agrupadas por status para o Kanban.
     */
    public function kanban(Request $request): JsonResponse
    {
        $query = ServiceOrder::query()
            ->with(['client:id,name,phone', 'technician:id,name'])
            ->whereNotIn('status', [ServiceOrderStatus::Delivered, ServiceOrderStatus::Cancelled]);

        if ($request->user()->isTecnico()) {
            $query->where('technician_id', $request->user()->id);
        }

        $orders = $query->orderByDesc('entry_date')->get();

        $columns = [];

        foreach (ServiceOrderStatus::cases() as $status) {
            if ($status->isTerminal()) {
                continue;
            }

            $columns[$status->value] = [
                'status' => $status->value,
                'label' => $status->label(),
                'orders' => ServiceOrderResource::collection(
                    $orders->where('status', $status)
                ),
            ];
        }

        return response()->json(['columns' => $columns]);
    }

    /**
     * Cria uma nova ordem de serviço.
     */
    public function store(StoreServiceOrderRequest $request): ServiceOrderResource
    {
        $order = $this->service->create($request->validated(), $request->user());

        return new ServiceOrderResource($order);
    }

    /**
     * Exibe os detalhes de uma OS (cliente, técnico, peças e histórico).
     */
    public function show(Request $request, ServiceOrder $serviceOrder): ServiceOrderResource
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        $serviceOrder->load('client', 'technician', 'items.product', 'history.user');

        return new ServiceOrderResource($serviceOrder);
    }

    /**
     * Atualiza os dados da OS (diagnóstico, custo, técnico, etc.).
     */
    public function update(UpdateServiceOrderRequest $request, ServiceOrder $serviceOrder): ServiceOrderResource|JsonResponse
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        try {
            $order = $this->service->update($serviceOrder, $request->validated(), $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $order->load('client', 'technician', 'items.product', 'history.user');

        return new ServiceOrderResource($order);
    }

    /**
     * Exclui uma OS, devolvendo as peças ao estoque (apenas admin).
     */
    public function destroy(Request $request, ServiceOrder $serviceOrder): JsonResponse
    {
        $this->service->delete($serviceOrder);

        return response()->json(['message' => 'Ordem de serviço excluída com sucesso.']);
    }

    /**
     * Altera o status da OS com validação de transição e geração
     * automática da transação financeira quando concluída.
     */
    public function updateStatus(UpdateServiceOrderStatusRequest $request, ServiceOrder $serviceOrder): ServiceOrderResource|JsonResponse
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        try {
            $order = $this->service->updateStatus(
                $serviceOrder,
                ServiceOrderStatus::from($request->validated('status')),
                $request->validated('comment'),
                $request->user(),
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $order->load('client', 'technician', 'items.product', 'history.user');

        return new ServiceOrderResource($order);
    }

    /**
     * Vincula uma peça à OS com baixa de estoque automática.
     */
    public function addItem(AddServiceOrderItemRequest $request, ServiceOrder $serviceOrder): ServiceOrderItemResource|JsonResponse
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        try {
            $item = $this->service->addItem(
                $serviceOrder,
                $request->integer('product_id'),
                $request->integer('quantity'),
                $request->filled('unit_price') ? (float) $request->input('unit_price') : null,
                $request->user(),
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return new ServiceOrderItemResource($item);
    }

    /**
     * Remove uma peça da OS devolvendo o estoque.
     */
    public function removeItem(Request $request, ServiceOrder $serviceOrder, ServiceOrderItem $item): JsonResponse
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        if ($item->service_order_id !== $serviceOrder->id) {
            return response()->json(['message' => 'Item não pertence a esta OS.'], 422);
        }

        try {
            $this->service->removeItem($serviceOrder, $item, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Peça removida da OS.']);
    }

    /**
     * Adiciona um comentário ao histórico da OS.
     */
    public function addComment(AddServiceOrderCommentRequest $request, ServiceOrder $serviceOrder): ServiceHistoryResource
    {
        $this->authorizeAccess($serviceOrder, $request->user());

        $history = $this->service->addComment(
            $serviceOrder,
            $request->validated('comment'),
            $request->user(),
        );

        return new ServiceHistoryResource($history->load('user'));
    }

    /**
     * Técnicos só podem acessar as OSs atribuídas a eles.
     */
    private function authorizeAccess(ServiceOrder $order, $user): void
    {
        if ($user->isTecnico() && $order->technician_id !== $user->id) {
            abort(403, 'Esta ordem de serviço não está atribuída a você.');
        }
    }
}
