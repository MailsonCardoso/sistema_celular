<?php

namespace App\Models\Concerns;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Aplica o isolamento multi-tenant (store_id + Global Scope) ao model,
 * expõe a relação com a loja e preenche o store_id automaticamente
 * em criações feitas por usuários autenticados.
 */
trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            if ($model->store_id === null && Auth::check()) {
                $model->store_id = Auth::user()?->store_id;
            }
        });
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Store::class);
    }
}
