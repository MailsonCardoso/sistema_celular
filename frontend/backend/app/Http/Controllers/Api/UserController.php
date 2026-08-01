<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Lista usuários da equipe da própria loja (filtro por role para selects).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()
            ->where('store_id', $request->user()->store_id)
            ->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.trim($request->string('search')).'%');
        }

        return UserResource::collection($query->limit(100)->get());
    }

    /**
     * Cria um usuário da equipe (admin da loja).
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'store_id' => $request->user()->store_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password,
            'role' => UserRole::from($request->role),
        ]);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Usuário cadastrado com sucesso.',
        ], 201);
    }

    /**
     * Atualiza dados de um usuário da equipe (admin da loja).
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->assertSameStore($request, $user);
        $this->assertNotSelf($request, $user);

        $data = $request->only('name', 'phone', 'role', 'is_active');

        if ($request->filled('email') && $request->email !== $user->email) {
            $data['email'] = $request->email;
        }

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        if (isset($data['is_active']) && ! $data['is_active']) {
            $this->assertNotLastActiveAdmin($user);
        }

        $user->update($data);

        return response()->json([
            'data' => new UserResource($user->fresh()),
            'message' => 'Usuário atualizado com sucesso.',
        ]);
    }

    /**
     * Desativa um usuário da equipe (mantém registros históricos).
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->assertSameStore($request, $user);
        $this->assertNotSelf($request, $user);
        $this->assertNotLastActiveAdmin($user);

        $user->update(['is_active' => false]);

        return response()->json(['message' => 'Usuário desativado.']);
    }

    private function assertSameStore(Request $request, User $user): void
    {
        if ($user->store_id !== $request->user()->store_id) {
            throw ValidationException::withMessages([
                'user' => ['Este usuário não pertence à sua loja.'],
            ]);
        }
    }

    private function assertNotSelf(Request $request, User $user): void
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => ['Você não pode alterar ou desativar o seu próprio usuário.'],
            ]);
        }
    }

    private function assertNotLastActiveAdmin(User $user): void
    {
        if ($user->role === UserRole::Admin && $user->is_active) {
            $activeAdmins = User::query()
                ->where('store_id', $user->store_id)
                ->where('role', UserRole::Admin)
                ->where('is_active', true)
                ->count();

            if ($activeAdmins <= 1) {
                throw ValidationException::withMessages([
                    'user' => ['Não é possível desativar o último administrador ativo da loja.'],
                ]);
            }
        }
    }
}
