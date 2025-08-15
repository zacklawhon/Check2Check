<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddFrequencyDetailsToIncomeSources extends Migration
{
    public function up()
    {
        $fields = [
            'frequency_day' => [
                'type'       => 'INT',
                'constraint' => 2,
                'null'       => true,
                'after'      => 'frequency',
                'comment'    => 'Day of week (1-7) for weekly/bi-weekly income.',
            ],
            'frequency_date_1' => [
                'type'       => 'INT',
                'constraint' => 2,
                'null'       => true,
                'after'      => 'frequency_day',
                'comment'    => 'First day of month (1-31) for monthly/semi-monthly.',
            ],
            'frequency_date_2' => [
                'type'       => 'INT',
                'constraint' => 2,
                'null'       => true,
                'after'      => 'frequency_date_1',
                'comment'    => 'Second day of month (1-31) for semi-monthly.',
            ],
        ];

        $this->forge->addColumn('income_sources', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('income_sources', [
            'frequency_day',
            'frequency_date_1',
            'frequency_date_2',
        ]);
    }
}
