<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Transações financeiras - fluxo de caixa (entradas e saídas).
     */
    public function up(): void
    {
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete();
            $table->string('description');
            $table->enum('type', \App\Enums\TransactionType::values());
            $table->enum('category', \App\Enums\TransactionCategory::values())->default('other');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', \App\Enums\PaymentMethod::values())->nullable();
            $table->enum('status', \App\Enums\TransactionStatus::values())->default('pending');
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->timestamps();

            $table->index(['type', 'due_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
