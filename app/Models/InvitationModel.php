<?php

namespace App\Models;

use CodeIgniter\Model;

class InvitationModel extends Model
{
    protected $table            = 'invitations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    
    // --- THIS IS THE FIX ---
    // Updated the allowed fields to match the database and new controller.
    protected $allowedFields    = [
        'inviter_user_id',
        'recipient_email',
        'token', // Renamed from 'invite_token'
        'status',
        'claimed_by_user_id',
        'claimed_at',
        'expires_at',       // Added this field
        'invite_type',      // Added this field
        'permission_level', // Added this field
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = ''; // No updated field
}
