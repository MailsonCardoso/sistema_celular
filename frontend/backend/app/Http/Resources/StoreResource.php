<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'store_name' => $this->store_name,
            'owner_name' => $this->owner_name,
            'cnpj_cpf' => $this->cnpj_cpf,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'subscription_status' => $this->subscription_status?->value,
            'subscription_label' => $this->subscription_status?->label(),
            'is_trial' => $this->isTrial(),
            'is_expired' => $this->isExpired(),
            'trial_limit_at' => $this->trial_limit_at,
            'created_at' => $this->created_at,
        ];

        if ($this->relationLoaded('users') || $request->routeIs('api.admin.stores.*')) {
            $data['counts'] = [
                'users' => $this->whenCounted('users'),
                'clients' => $this->whenCounted('clients'),
                'products' => $this->whenCounted('products'),
                'service_orders' => $this->whenCounted('serviceOrders'),
            ];
        }

        return $data;
    }
}
