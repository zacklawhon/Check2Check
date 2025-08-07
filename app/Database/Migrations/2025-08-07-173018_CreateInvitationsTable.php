<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateInvitationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'inviter_user_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'recipient_email' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'invite_token' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'status' => [
                'type' => "ENUM('sent', 'claimed')",
                'default' => 'sent',
            ],
            'claimed_by_user_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'claimed_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('invite_token');
        $this->forge->addForeignKey('inviter_user_id', 'users', 'id', 'CASCADE', 'NO ACTION');
        $this->forge->addForeignKey('claimed_by_user_id', 'users', 'id', 'CASCADE', 'NO ACTION');
        $this->forge->createTable('invitations');
    }

    public function down()
    {
        $this->forge->dropTable('invitations');
    }
}