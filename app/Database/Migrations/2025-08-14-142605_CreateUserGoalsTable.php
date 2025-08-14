<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUserGoalsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'user_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'goal_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
            ],
            'goal_type' => [
                'type'       => 'ENUM',
                'constraint' => ['debt_reduction', 'savings'],
                'default'    => 'debt_reduction',
            ],
            'strategy' => [
                'type'       => 'ENUM',
                'constraint' => ['avalanche', 'snowball', 'hybrid'],
                'null'       => true, // Can be null if it's a savings goal
            ],
            'target_amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'comment'    => 'For debt, this is the starting balance. For savings, the goal amount.',
            ],
            'current_amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'comment'    => 'For debt, this is the current outstanding balance.',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['active', 'completed'],
                'default'    => 'active',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('user_goals');
    }

    public function down()
    {
        $this->forge->dropTable('user_goals');
    }
}
