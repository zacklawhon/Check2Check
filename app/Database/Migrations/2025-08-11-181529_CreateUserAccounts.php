<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUserAccounts extends Migration
{
    public function up()
    {
        // 1. Create the new user_accounts table
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'user_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'account_name' => ['type' => 'VARCHAR', 'constraint' => '255'],
            'account_type' => ['type' => "ENUM('checking','savings','other')", 'default' => 'savings'],
            'current_balance' => ['type' => 'DECIMAL', 'constraint' => '10,2', 'default' => 0.00],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('user_accounts');

        // 2. Migrate existing savings data from the old table
        $db = \Config\Database::connect();
        $usersWithSavings = $db->table('user_financial_tools')
                                ->where('has_savings_account', 1)
                                ->get()->getResultArray();

        foreach ($usersWithSavings as $tool) {
            $this->db->table('user_accounts')->insert([
                'user_id' => $tool['user_id'],
                'account_name' => 'Default Savings',
                'account_type' => 'savings',
                'current_balance' => $tool['current_savings_balance'] ?? 0.00,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        // 3. Clean up the old user_financial_tools table by removing redundant columns
        $this->forge->dropColumn('user_financial_tools', 'has_savings_account');
        $this->forge->dropColumn('user_financial_tools', 'current_savings_balance');
        $this->forge->dropColumn('user_financial_tools', 'savings_goal');
    }

    public function down()
    {
        // Logic to reverse the changes if needed
        $this->forge->dropTable('user_accounts');

        $fields = [
            'has_savings_account' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'current_savings_balance' => ['type' => 'DECIMAL', 'constraint' => '10,2', 'default' => 0.00],
            'savings_goal' => ['type' => 'DECIMAL', 'constraint' => '10,2', 'default' => 2000.00],
        ];
        $this->forge->addColumn('user_financial_tools', $fields);
    }
}