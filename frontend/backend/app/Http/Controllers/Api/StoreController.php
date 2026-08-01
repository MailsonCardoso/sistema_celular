<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
}
