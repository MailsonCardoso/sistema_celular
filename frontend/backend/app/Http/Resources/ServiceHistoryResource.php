<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'action_type' => $this->action_type->value,
            'action_label' => $this->action_type->label(),
            'description' => $this->description,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'created_at' => $this->created_at,
        ];
    }
}
