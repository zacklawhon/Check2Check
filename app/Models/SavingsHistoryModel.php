<?php

namespace App\Models;

use CodeIgniter\Model;

class SavingsHistoryModel extends Model
{
    protected $table            = 'savings_history';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    
    protected $allowedFields    = [
        'user_id',
        'balance',
        'logged_at'
    ];

    // Dates
    protected $useTimestamps = false; // We let the DB handle the 'logged_at' default
}