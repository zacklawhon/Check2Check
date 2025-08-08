<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use App\Models\FeedbackModel;

class FeedbackController extends BaseController
{
    use ResponseTrait;

    /**
     * Submits user feedback to the system.
     *
     * Validates the feedback type, subject, message, page URL, and user agent, then saves the feedback
     * to the FeedbackModel along with the authenticated user’s ID. Returns a success response if saved,
     * or an error response for invalid input or server issues. No redundancy with other controllers as
     * feedback submission is a unique feature. Follows standard CodeIgniter API pattern (validate, process, respond).
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response if feedback is saved, a validation error
     * for invalid input, or a 500 error if insertion fails.
     */
    public function submit()
    {
        $rules = [
            'type' => 'required|in_list[bug,feature,general]',
            'subject' => 'required|string|max_length[255]',
            'message' => 'required|string',
            'page_url' => 'required|string|max_length[255]',
            'user_agent' => 'required|string|max_length[255]',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $feedbackModel = new FeedbackModel();
        $data = $this->validator->getValidated();
        $data['user_id'] = session()->get('userId');

        if ($feedbackModel->insert($data)) {
            return $this->respondCreated(['message' => 'Feedback submitted successfully. Thank you!']);
        }

        return $this->failServerError('Could not submit feedback.');
    }
}