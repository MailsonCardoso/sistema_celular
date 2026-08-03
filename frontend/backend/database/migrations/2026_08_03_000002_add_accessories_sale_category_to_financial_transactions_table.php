<?php

use App\Enums\TransactionCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Adiciona a categoria "accessories_sale" (venda de acessórios) ao enum da coluna category.
     */
    public function up(): void
    {
        $values = implode("','", TransactionCategory::values());

        DB::statement(
            "ALTER TABLE financial_transactions MODIFY COLUMN category ENUM('{$values}') DEFAULT 'other'"
        );
    }

    public function down(): void
    {
        // Nenhor ação reversa específica; a coluna mantém os valores do enum.
    }
};
