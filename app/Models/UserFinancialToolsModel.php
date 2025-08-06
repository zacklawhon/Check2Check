<?php

namespace App\Models;

use CodeIgniter\Model;

class UserFinancialToolsModel extends Model
{
    protected $table = 'user_financial_tools';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $protectFields = true;

    // Updated to include the new columns from your DB changes
    protected $allowedFields = [
        'user_id',
        'has_checking_account',
        'has_savings_account',
        'has_credit_card',
        'current_savings_balance',
        'savings_goal'
    ];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat = 'datetime';

}