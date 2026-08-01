<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de autorização baseado na role do usuário.
 *
 * Uso: ->middleware('role:admin') ou ->middleware('role:admin,tecnico')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        if (! in_array($user->role->value, $roles, true)) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        return $next($request);
    }
}
