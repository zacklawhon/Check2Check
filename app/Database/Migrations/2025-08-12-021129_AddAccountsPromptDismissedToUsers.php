<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddAccountsPromptDismissedToUsers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('users', [
            'has_seen_accounts_prompt' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
                'after' => 'status'
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('users', 'has_seen_accounts_prompt');
    }
}