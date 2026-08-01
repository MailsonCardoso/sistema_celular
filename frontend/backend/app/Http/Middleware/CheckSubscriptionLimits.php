<?php

namespace App\Http\Middleware;

use App\Services\TrialLimitsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifica os limites da versão trial nas rotas de criação.
 * Uso: ->middleware('limits:os|client|product')
 */
class CheckSubscriptionLimits
{
    public function __construct(private readonly TrialLimitsService $limits) {}

    public function handle(Request $request, Closure $next, string ...$resources): Response
    {
        $user = $request->user();

        foreach ($resources as $resource) {
            match ($resource) {
                'os' => $this->limits->assertCanCreateServiceOrder($user),
                'client' => $this->limits->assertCanCreateClient($user),
                'product' => $this->limits->assertCanCreateProduct($user),
                'financial' => $this->limits->assertCanSeeFinancial($user),
                default => null,
            };
        }

        return $next($request);
    }
}
