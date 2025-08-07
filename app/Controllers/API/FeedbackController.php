<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use App\Models\FeedbackModel;

class FeedbackController extends BaseController
{
    use ResponseTrait;

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