<?php

namespace App\Models;

use CodeIgniter\Model;

class IncomeSourceModel extends Model
{
    protected $table            = 'income_sources';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $useTimestamps    = false;

    
    protected $allowedFields    = [
        'user_id',
        'label', 
        'description',
        'frequency',
        'is_active'
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
            'user_id'   => $userId,
            'label'     => $data['label'],
            'frequency' => $data['frequency'] ?: 'one-time',
        ];

        return $this->insert($newData);
    }
}