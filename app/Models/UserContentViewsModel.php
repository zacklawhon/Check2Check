<?php

namespace App\Models;

use CodeIgniter\Model;

class UserContentViewsModel extends Model
{
    protected $table            = 'user_content_views';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'user_id',
        'content_id',
        'viewed_at',
    ];

    // We can manage the timestamp manually, so no need for auto-timestamps here.
    protected $useTimestamps = false;
}