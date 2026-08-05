<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona a numeração sequencial estruturada da OS (por loja e por ano,
     * ex.: 0001/2026) e renumera as OSs existentes pela ordem de entrada.
     */
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->unsignedInteger('os_number')->nullable()->after('id');
            $table->unsignedSmallInteger('os_number_year')->nullable()->after('os_number');
            $table->unique(['store_id', 'os_number_year', 'os_number'], 'service_orders_store_year_num_unique');
        });

        $storeIds = DB::table('service_orders')
            ->select('store_id')
            ->distinct()
            ->orderBy('store_id')
            ->pluck('store_id');

        foreach ($storeIds as $storeId) {
            $orders = DB::table('service_orders')
                ->where('store_id', $storeId)
                ->orderBy('entry_date')
                ->orderBy('id')
                ->get(['id', 'entry_date']);

            $counters = [];

            foreach ($orders as $order) {
                $year = (int) substr((string) $order->entry_date, 0, 4);
                $counters[$year] = ($counters[$year] ?? 0) + 1;

                DB::table('service_orders')->where('id', $order->id)->update([
                    'os_number' => $counters[$year],
                    'os_number_year' => $year,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropUnique('service_orders_store_year_num_unique');
            $table->dropColumn(['os_number', 'os_number_year']);
        });
    }
};
