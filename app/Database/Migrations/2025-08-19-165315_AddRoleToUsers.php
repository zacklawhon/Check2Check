<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRoleToUsers extends Migration
{
    public function up()
    {
        $fields = [
            'role' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'default' => 'user',
                'after' => 'email', // Places the column after the 'email' column
            ],
        ];
        $this->forge->addColumn('users', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('users', 'role');
    }
}
