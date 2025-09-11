<?php
namespace App\Models;
use CodeIgniter\Model;

class RecurringExpenseModel extends Model
{
    protected $table = 'recurring_expenses';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'user_id',
        'manage_url',
        'label',
        'due_date',
        'category',
        'principal_balance',
        'interest_rate',
        'outstanding_balance',
        'spending_limit',
        'maturity_date',
        'is_active'
    ];

    protected $useTimestamps = false;
}