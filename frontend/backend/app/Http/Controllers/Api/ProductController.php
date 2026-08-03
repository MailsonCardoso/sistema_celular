<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * Lista produtos com busca, filtros e alerta de estoque baixo.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->orderBy('name');

        if ($request->filled('search')) {
            $search = trim($request->string('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock_quantity', '<=', 'min_stock_quantity');
        }

        return ProductResource::collection(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    /**
     * Resumo do estoque da loja (todos os produtos, sem filtros nem paginação).
     */
    public function summary(): JsonResponse
    {
        $stockValue = (float) Product::query()
            ->selectRaw('COALESCE(SUM(stock_quantity * selling_price), 0) as value')
            ->value('value');

        $totalItems = (int) Product::query()->sum('stock_quantity');

        return response()->json([
            'stock_value' => $stockValue,
            'total_items' => $totalItems,
        ]);
    }

    /**
     * Opções compactas para selects do frontend (somente ativos).
     */
    public function options(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->where('status', ProductStatus::Active->value)
            ->orderBy('name');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.trim($request->string('search')).'%');
        }

        return ProductResource::collection($query->limit(50)->get());
    }

    /**
     * Cadastra um novo produto/peça.
     */
    public function store(StoreProductRequest $request): ProductResource
    {
        $product = Product::create($request->validated());

        return new ProductResource($product);
    }

    /**
     * Exibe um produto.
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product);
    }

    /**
     * Atualiza o produto (incluindo ajuste manual de estoque).
     */
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product);
    }

    /**
     * Exclui um produto (apenas se não estiver em uso em OSs).
     */
    public function destroy(Product $product): JsonResponse
    {
        if ($product->serviceOrderItems()->exists()) {
            return response()->json([
                'message' => 'Este produto já foi utilizado em ordens de serviço e não pode ser excluído. Inative-o.',
            ], 422);
        }

        $product->delete();

        return response()->json(['message' => 'Produto excluído com sucesso.']);
    }
}
