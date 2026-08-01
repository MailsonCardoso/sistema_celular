<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabela de ordens de serviço - núcleo operacional do ERP.
     */
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('device_brand');
            $table->string('device_model');
            $table->string('device_imei', 30)->nullable();
            $table->string('device_password')->nullable();
            $table->text('reported_issue');
            $table->text('technical_diagnosis')->nullable();
            $table->enum('status', \App\Enums\ServiceOrderStatus::values())->default('opened');
            $table->decimal('service_cost', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->date('entry_date');
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'entry_date']);
            $table->index('technician_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
