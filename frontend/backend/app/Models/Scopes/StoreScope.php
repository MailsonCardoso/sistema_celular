<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * Isola os dados por loja (store_id) em todas as consultas.
 * O Super Admin (usuário sem store_id) enxerga todas as lojas.
 *
 * A flag de reentrância evita loops caso o Auth::user() dispare
 * novas consultas no model durante a resolução da própria autenticação.
 */
class StoreScope implements Scope
{
    public static bool $resolving = false;

    public function apply(Builder $builder, Model $model): void
    {
        if (self::$resolving) {
            return;
        }

        self::$resolving = true;

        try {
            $storeId = Auth::check() ? Auth::user()?->store_id : null;

            if ($storeId !== null) {
                $builder->where($model->getTable().'.store_id', $storeId);
            }
        } finally {
            self::$resolving = false;
        }
    }
}
