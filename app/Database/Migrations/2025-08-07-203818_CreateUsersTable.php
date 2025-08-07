<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'email' => ['type' => 'VARCHAR', 'constraint' => '255'],
            'demographic_zip_code' => ['type' => 'VARCHAR', 'constraint' => '10', 'null' => true],
            'demographic_age_range' => ['type' => 'VARCHAR', 'constraint' => '20', 'null' => true],
            'demographic_sex' => ['type' => 'VARCHAR', 'constraint' => '20', 'null' => true],
            'demographic_household_size' => ['type' => 'INT', 'constraint' => 11, 'null' => true],
            'demographic_prompt_dismissed' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'financial_tier' => ['type' => 'INT', 'constraint' => 11, 'default' => 1],
            'status' => ['type' => "ENUM('active','anonymized')", 'default' => 'active'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('email');
        $this->forge->createTable('users');
    }

    public function down()
    {
        $this->forge->dropTable('users');
    }
}