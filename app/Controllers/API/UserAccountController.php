<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\UserAccountModel;
use CodeIgniter\API\ResponseTrait;

class UserAccountController extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        $userId = session()->get('userId');
        $model = new UserAccountModel();
        $accounts = $model->where('user_id', $userId)->findAll();
        return $this->respond($accounts);
    }

    public function create()
    {
        $userId = session()->get('userId');
        $rules = [
            'account_name' => 'required|string|max_length[255]',
            'account_type' => 'required|in_list[checking,savings,credit_card,other]',
            'current_balance' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = $this->validator->getValidated();
        $data['user_id'] = $userId;

        $model = new UserAccountModel();
        $id = $model->insert($data);

        if ($id === false) {
            return $this->fail($model->errors());
        }

        $newAccount = $model->find($id);
        return $this->respondCreated($newAccount);
    }

    public function update($id = null)
    {
        $userId = session()->get('userId');
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        $rules = [
            'account_name' => 'required|string|max_length[255]',
            'account_type' => 'required|in_list[checking,savings,other]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        if ($model->update($id, $this->validator->getValidated()) === false) {
            return $this->fail($model->errors());
        }

        return $this->respondUpdated($model->find($id));
    }

    public function delete($id = null)
    {
        $userId = session()->get('userId');
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id]);
        }

        return $this->failServerError('Could not delete account.');
    }

    public function updateBalance($id = null)
    {
        $userId = session()->get('userId');
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        $rules = ['current_balance' => 'required|decimal'];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        if ($model->update($id, ['current_balance' => $this->request->getVar('current_balance')]) === false) {
            return $this->fail($model->errors());
        }

        return $this->respondUpdated($model->find($id));
    }
}