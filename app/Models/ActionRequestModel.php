<?php

namespace App\Models;

use CodeIgniter\Model;

class ActionRequestModel extends Model
{
    protected $table            = 'action_requests';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'requester_user_id',
        'owner_user_id',
        'budget_cycle_id',
        'action_type',
        'payload',
        'description',
        'status'
    ];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = null;
}