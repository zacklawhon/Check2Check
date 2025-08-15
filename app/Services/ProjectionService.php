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

    private function createIncomeEvent(array $rule, string $date): array
    {
        return [
            'label'  => $rule['label'],
            'amount' => (float)$rule['amount'],
            'date'   => $date,
        ];
    }
}
