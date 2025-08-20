<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSharingFeatures extends Migration
{
    public function up()
    {
        // 1. Add new columns to the 'users' table for partner linking
        $this->forge->addColumn('users', [
            'owner_user_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'id', // Place it near the primary key for clarity
            ],
            'permission_level' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
                'after'      => 'owner_user_id',
            ],
        ]);

        // 2. Add new columns to the existing 'invitations' table
        $this->forge->addColumn('invitations', [
            'invite_type' => [
                'type'       => 'ENUM',
                'constraint' => ['join', 'share'],
                'default'    => 'join',
                'after'      => 'status',
            ],
            'permission_level' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
                'after'      => 'invite_type',
            ],
        ]);

        // 3. Create the new 'action_requests' table
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'requester_user_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'owner_user_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'budget_cycle_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
            ],
            'action_type' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'payload' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'description' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'default'    => 'pending',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('requester_user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('owner_user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('budget_cycle_id', 'budget_cycles', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('action_requests');
    }

    public function down()
    {
        // Drop the new table and columns in reverse order of creation
        $this->forge->dropTable('action_requests');

        $this->forge->dropColumn('invitations', 'invite_type');
        $this->forge->dropColumn('invitations', 'permission_level');

        $this->forge->dropColumn('users', 'owner_user_id');
        $this->forge->dropColumn('users', 'permission_level');
    }
}
