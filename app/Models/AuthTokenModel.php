<?php
namespace App\Models;
use CodeIgniter\Model;
class AuthTokenModel extends Model
{
    protected $table = 'auth_tokens';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'token', 'expires_at'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';
}