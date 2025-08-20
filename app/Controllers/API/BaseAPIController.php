<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class BaseAPIController extends BaseController
{
    use ResponseTrait;

    /**
     * Gets the effective user ID for data fetching.
     * If the logged-in user is a partner, it returns the owner's ID.
     * Otherwise, it returns the user's own ID.
     *
     * @return int|null The user ID to be used in database queries.
     */
    protected function getEffectiveUserId(): ?int
    {
        $session = session();
        // If ownerUserId is set in the session, use it. Otherwise, use the regular userId.
        return $session->get('ownerUserId') ?? $session->get('userId');
    }

    /**
     * Gets the permission level of the current user.
     * Returns null if the user is not a partner.
     *
     * @return string|null The permission level (e.g., 'read_only').
     */
    protected function getPermissionLevel(): ?string
    {
        return session()->get('permissionLevel');
    }

    protected function handlePartnerAction(string $actionType, string $description, int $budgetId, array $payload)
    {
        $session = session();
        $requesterId = $session->get('userId');
        $ownerId = $this->getEffectiveUserId();

        $actionRequestModel = new \App\Models\ActionRequestModel();
        $actionRequestModel->insert([
            'requester_user_id' => $requesterId,
            'owner_user_id'     => $ownerId,
            'budget_cycle_id'   => $budgetId,
            'action_type'       => $actionType,
            'payload'           => json_encode($payload),
            'description'       => $description,
        ]);

        return $this->respond(['message' => 'Your request has been sent to the budget owner for approval.']);
    }
}
