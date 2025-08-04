<?php
namespace App\Models;
use CodeIgniter\Model;
class IncomeAdjustmentModel extends Model
{
    protected $table = 'income_adjustments';
    protected $primaryKey = 'id';
    protected $allowedFields = ['budget_cycle_id', 'amount', 'reason'];
    protected $useTimestamps = true;
}