<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'os_number' => $this->os_number,
            'os_number_formatted' => $this->osNumberFormatted,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'technician_id' => $this->technician_id,
            'technician' => new UserResource($this->whenLoaded('technician')),
            'device_brand' => $this->device_brand,
            'device_model' => $this->device_model,
            'device_imei' => $this->device_imei,
            'device_password' => $this->when(
                $request->route()?->getName() === 'api.service-orders.show',
                $this->device_password,
            ),
            'reported_issue' => $this->reported_issue,
            'technical_diagnosis' => $this->technical_diagnosis,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'service_cost' => (float) $this->service_cost,
            'discount' => (float) $this->discount,
            'parts_total' => (float) $this->whenLoaded('items', fn () => $this->partsTotal(), 0),
            'total_amount' => (float) $this->total_amount,
            'entry_date' => $this->entry_date?->format('Y-m-d'),
            'expected_delivery_at' => $this->expected_delivery_at?->format('Y-m-d H:i'),
            'delivery_date' => $this->delivery_date?->format('Y-m-d'),
            'notes' => $this->notes,
            'checklist' => $this->checklist,
            'items' => ServiceOrderItemResource::collection($this->whenLoaded('items')),
            'history' => $this->when(
                $this->historyVisibleFor($request),
                ServiceHistoryResource::collection($this->whenLoaded('history')),
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Histórico de auditoria é sempre gravado, mas fica oculto
     * para lojas na versão trial (recurso do plano completo).
     */
    private function historyVisibleFor(Request $request): bool
    {
        $user = $request->user();

        if (! $user || $user->isSuperAdmin() || ! $user->store_id) {
            return true;
        }

        return ! $user->store?->isTrial();
    }
}
