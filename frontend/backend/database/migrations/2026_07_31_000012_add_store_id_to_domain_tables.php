<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'clients',
        'products',
        'service_orders',
        'service_order_items',
        'service_history',
        'financial_transactions',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('store_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('stores')
                    ->nullOnDelete();
                $table->index('store_id');
            });
        }

        Schema::table('clients', function (Blueprint $table) {
            $table->unique(['store_id', 'cpf_cnpj'], 'clients_store_cpf_unique');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_store_cpf_unique');
        });

        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropForeign(['store_id']);
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }
};
