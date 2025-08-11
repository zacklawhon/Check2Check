<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddTransferLinkToExpenses extends Migration
{
    public function up()
    {
        $this->forge->addColumn('recurring_expenses', [
            'transfer_to_account_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null' => true,
                'after' => 'category'
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('recurring_expenses', 'transfer_to_account_id');
    }
}
