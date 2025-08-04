<?php
namespace App\Models;
use CodeIgniter\Model;
class LearnedSpendingCategoryModel extends Model
{
    protected $table = 'learned_spending_categories';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'name', 'is_active'];
    protected $useTimestamps = false;
}