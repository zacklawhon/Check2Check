<?php
namespace App\Services;

use App\Models\UserModel;
use App\Models\UserFinancialToolsModel;
use App\Models\TransactionModel;
use App\Models\BudgetCycleModel;
use App\Models\LearnedSpendingCategoryModel;
use Exception;

class UserService
{

    /**
     * Creates a new learned spending category for a user.
     *
     * @param int    $userId The user's ID.
     * @param string $name   The name of the new category.
     * @return int The ID of the new or existing category.
     * @throws \Exception
     */
    public function createSpendingCategory(int $userId, string $name): int
    {
        $model = new LearnedSpendingCategoryModel();

        // Check if a category with this name already exists for the user.
        $exists = $model->where('user_id', $userId)->where('name', $name)->first();
        if ($exists) {
            return $exists['id'];
        }
        
        $data = [
            'user_id' => $userId,
            'name'    => $name,
        ];

        try {
            if ($model->save($data)) {
                return $model->getInsertID();
            }
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_CREATE_SPENDING_CATEGORY] ' . $e->getMessage());
            throw $e;
        }

        // This line should ideally not be reached if exceptions are handled correctly.
        throw new \Exception('Could not save spending category.');
    }

    
}