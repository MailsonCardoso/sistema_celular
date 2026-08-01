<?php

namespace App\Http\Controllers\Api;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\StoreResource;
use App\Http\Resources\UserResource;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registra uma nova loja em trial (com o admin) e inicia a sessão.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $store = Store::create([
            'store_name' => $request->store_name,
            'owner_name' => $request->owner_name,
            'cnpj_cpf' => $request->cnpj_cpf,
            'email' => $request->email,
            'phone' => $request->phone,
            'subscription_status' => SubscriptionStatus::TrialActive,
            'trial_limit_at' => now()->addDays(30),
        ]);

        $user = User::create([
            'store_id' => $store->id,
            'name' => $request->owner_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password,
            'role' => UserRole::Admin,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => new UserResource($user->load('store')),
            'store' => new StoreResource($store),
            'message' => 'Loja cadastrada com sucesso. Aproveite seu período de teste!',
        ], 201);
    }

    /**
     * Autentica o usuário via sessão (cookies) para SPA.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas estão incorretas.'],
            ]);
        }

        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Este usuário está desativado. Contate o administrador da loja.'],
            ]);
        }

        if (! $user->isSuperAdmin() && $user->store?->isExpired()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Sua loja está suspensa. Fale com o suporte para reativar o acesso.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => new UserResource($user->load('store')),
            'store' => $user->store ? new StoreResource($user->store) : null,
            'message' => 'Login realizado com sucesso.',
        ]);
    }

    /**
     * Encerra a sessão do usuário autenticado.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sessão encerrada com sucesso.']);
    }

    /**
     * Retorna o usuário autenticado na sessão atual.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('store');

        return response()->json([
            'user' => new UserResource($user),
            'store' => $user->store ? new StoreResource($user->store) : null,
        ]);
    }
}
