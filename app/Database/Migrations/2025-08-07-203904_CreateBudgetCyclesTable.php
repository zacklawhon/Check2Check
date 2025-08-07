<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBudgetCyclesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'start_date' => ['type' => 'DATE'],
            'end_date' => ['type' => 'DATE'],
            'status' => ['type' => "ENUM('active','completed')", 'default' => 'active'],
            'initial_income' => ['type' => 'LONGTEXT'],
            'initial_expenses' => ['type' => 'LONGTEXT'],
            'final_summary' => ['type' => 'LONGTEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('budget_cycles');
    }

    public function down()
    {
        $this->forge->dropTable('budget_cycles');
    }
}