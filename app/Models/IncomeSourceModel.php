<?php

namespace App\Models;

use CodeIgniter\Model;

class IncomeSourceModel extends Model
{
    protected $table = 'income_sources';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $useTimestamps = false;


    protected $allowedFields = [
        'user_id',
        'label',
        'description',
        'frequency',
        'is_active',
        // --- NEW FIELDS FOR PROJECTION ENGINE ---
        'frequency_day',      // For weekly/bi-weekly: day of the week (e.g., 5 for Friday)
        'frequency_date_1',   // For monthly/semi-monthly: first day of the month (e.g., 15)
        'frequency_date_2',   // For semi-monthly: second day of the month (e.g., 30)
    ];

    public function findOrCreate($userId, $data)
    {
        // Check if a template with this label already exists for the user
        $exists = $this->where('user_id', $userId)
            ->where('label', $data['label'])
            ->first();

        if ($exists) {
            return $exists['id']; // Return the ID of the existing template
        }

        // If it doesn't exist, create it and return the new ID
        $newData = [
            'user_id' => $userId,
            'label' => $data['label'],
            'frequency' => $data['frequency'] ?: 'one-time',
        ];

        return $this->insert($newData);
    }
}
