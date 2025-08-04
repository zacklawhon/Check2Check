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
}