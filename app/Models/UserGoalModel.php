<?php

namespace App\Models;

use CodeIgniter\Model;

class UserGoalModel extends Model
{
    protected $table            = 'user_goals';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'user_id',
        'goal_name',
        'goal_type',
        'strategy',
        'linked_account_id',
        'target_amount',
        'current_amount',
        'status',
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}