<?php
namespace App\Models;
use CodeIgniter\Model;
class ExpenseAdjustmentModel extends Model
{
    protected $table = 'expense_adjustments';
    protected $primaryKey = 'id';
    protected $allowedFields = ['budget_cycle_id', 'amount', 'reason'];
    protected $useTimestamps = true;
}