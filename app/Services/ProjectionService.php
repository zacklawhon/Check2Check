<?php

namespace App\Services;

use DateTime;

class ProjectionService
{
    public function projectIncome(string $startDate, string $endDate, array $incomeRules): array
    {
        $projectedIncome = [];
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);

        foreach ($incomeRules as $rule) {
            // For now, we only project the selected items that have an amount
            if (empty($rule['amount'])) {
                continue;
            }

            switch ($rule['frequency']) {
                case 'weekly':
                    $dayOfWeek = (int)$rule['frequency_day'];
                    $current = clone $start;
                    // Find the first occurrence
                    while ((int)$current->format('N') % 7 !== $dayOfWeek % 7) {
                        $current->modify('+1 day');
                    }
                    // Add all occurrences within the date range
                    while ($current <= $end) {
                        $projectedIncome[] = $this->createIncomeEvent($rule, $current->format('Y-m-d'));
                        $current->modify('+1 week');
                    }
                    break;
                
                // Note: Logic for bi-weekly, semi-monthly, etc., would be added here.
                // For this initial implementation, we'll focus on weekly and one-time.

                case 'one-time':
                    // Assuming a 'date' field for one-time income, for now we pass it through
                    $projectedIncome[] = $this->createIncomeEvent($rule, $startDate); // Placeholder date
                    break;
                
                default:
                    // For simplicity, we'll treat other frequencies as a single occurrence for now
                    $projectedIncome[] = $this->createIncomeEvent($rule, $start->format('Y-m-d'));
                    break;
            }
        }
        return $projectedIncome;
    }

    public function projectExpenses(string $startDate, string $endDate, array $expenseRules): array
    {
        $projectedExpenses = [];
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);

        foreach ($expenseRules as $rule) {
            if (empty($rule['due_date'])) {
                continue; // Skip expenses without a due date for now
            }

            $dueDateDay = (int)$rule['due_date'];
            $current = clone $start;

            // Loop through each day in the budget cycle
            while ($current <= $end) {
                // If the day of the month matches the due date, add it to the projection
                if ((int)$current->format('j') === $dueDateDay) {
                    $projectedExpenses[] = [
                        'label' => $rule['label'],
                        'estimated_amount' => (float)($rule['estimated_amount'] ?? 0), // Use a default if not set
                        'date' => $current->format('Y-m-d'),
                        'category' => $rule['category'],
                    ];
                }
                $current->modify('+1 day');
            }
        }
        return $projectedExpenses;
    }

    private function createIncomeEvent(array $rule, string $date): array
    {
        return [
            'label'  => $rule['label'],
            'amount' => (float)$rule['amount'],
            'date'   => $date,
        ];
    }
}
