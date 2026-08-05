<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStoreRequest;
use App\Http\Resources\StoreResource;
use App\Services\TrialLimitsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function __construct(private readonly TrialLimitsService $limits) {}

    /**
     * Situação da loja autenticada (status + limites usados) para a UI.
     */
    public function limits(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->limits->statusFor($request->user()),
        ]);
    }

    /**
     * Atualiza os dados cadastrais da loja autenticada (usados na impressão da OS).
     */
    public function update(UpdateStoreRequest $request): JsonResponse
    {
        $store = $request->user()->store;
        $store->update($request->validated());

        return response()->json([
            'data' => new StoreResource($store->fresh()),
        ]);
    }
}
