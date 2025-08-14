<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddLinkedAccountToGoals extends Migration
{
    public function up()
    {
        $this->forge->addColumn('user_goals', [
            'linked_account_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'strategy', // Places the column in a logical spot
            ],
        ]);

        // We add a foreign key constraint to ensure data integrity
        $this->forge->addForeignKey('linked_account_id', 'user_accounts', 'id', 'SET NULL', 'SET NULL');
        $this->db->query('ALTER TABLE `user_goals` MODIFY `strategy` ENUM(\'avalanche\',\'snowball\',\'hybrid\',\'savings\')');
    }

    public function down()
    {
        $this->forge->dropForeignKey('user_goals', 'user_goals_linked_account_id_foreign');
        $this->forge->dropColumn('user_goals', 'linked_account_id');
        $this->db->query('ALTER TABLE `user_goals` MODIFY `strategy` ENUM(\'avalanche\',\'snowball\',\'hybrid\')');
    }
}
