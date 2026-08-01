<?php

namespace App\Models;

use App\Enums\HistoryActionType;
use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceHistory extends Model
{
    use BelongsToStore, HasFactory;

    protected $table = 'service_history';

    protected $fillable = [
        'store_id',
        'service_order_id',
        'user_id',
        'action_type',
        'description',
        'old_value',
        'new_value',
    ];

    protected function casts(): array
    {
        return [
            'action_type' => HistoryActionType::class,
        ];
    }

    public function serviceOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
