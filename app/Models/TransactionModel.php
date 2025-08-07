<?php

namespace App\Models;

use CodeIgniter\Model;

class TransactionModel extends Model
{
    protected $table = 'transactions';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $protectFields = true;

    protected $allowedFields = [
        'user_id',
        'budget_cycle_id',
        'type',
        'category_name',
        'amount',
        'description',
        'transacted_at',
    ];

    protected $useTimestamps = false;

    protected $validationRules = [
        'user_id' => 'required|integer',
        'budget_cycle_id' => 'required|integer',
        'type' => 'required|in_list[income,expense,savings]',
        'category_name' => 'required|string|max_length[255]',
        'amount' => 'required|decimal',
        'description' => 'permit_empty|string',
    ];

    /**
     * NEW: Centralized function to log a transaction securely.
     */
    public function logTransaction(int $userId, int $budgetCycleId, string $type, string $category, float $amount, ?string $description = null)
    {
        // Security Check: Ensure the budget cycle belongs to the logged-in user before inserting.
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetCycleId)
            ->where('user_id', $userId)
            ->first();

        if (!$budgetCycle) {
            // Throw an exception if access is denied, to be caught by the controller.
            throw new \Exception('Budget cycle not found or access denied.');
        }

        $data = [
            'user_id' => $userId,
            'budget_cycle_id' => $budgetCycleId,
            'type' => $type,
            'category_name' => $category,
            'amount' => $amount,
            'description' => $description,
        ];

        return $this->insert($data);
    }
}