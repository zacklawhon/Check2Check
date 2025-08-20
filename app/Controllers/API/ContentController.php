<?php

namespace App\Controllers\API;

use App\Models\ContentModel;
use App\Models\UserContentViewsModel;
use CodeIgniter\API\ResponseTrait;

class ContentController extends BaseAPIController
{
    use ResponseTrait;

    // This method is compliant. It fetches public content and needs no changes.
    public function getAllContent()
    {
        $contentModel = new ContentModel();
        $allContent = $contentModel->where('is_active', 1)->findAll();

        $keyedContent = [];
        foreach ($allContent as $item) {
            $keyedContent[$item['page_key']] = [
                'title' => $item['title'],
                'content' => [$item['content']]
            ];
        }

        return $this->respond($keyedContent);
    }

    public function getLatestAnnouncement()
    {
        // CHANGED: Use the individual user's ID, not the effective (owner's) ID.
        // This ensures a partner and owner have separate "seen" histories for announcements.
        $userId = session()->get('userId');
        $contentModel = new ContentModel();

        $latestAnnouncement = $contentModel
            ->where('is_active', 1)
            ->where('is_announcement', 1)
            ->orderBy('created_at', 'DESC')
            ->first();

        if (!$latestAnnouncement) {
            return $this->respond(null);
        }

        $viewsModel = new UserContentViewsModel();
        $hasSeen = $viewsModel
            ->where('user_id', $userId) // Query uses the correct individual ID
            ->where('content_id', $latestAnnouncement['id'])
            ->first();

        if ($hasSeen) {
            return $this->respond(null);
        }

        return $this->respond([
            'id'      => $latestAnnouncement['id'],
            'title'   => $latestAnnouncement['title'],
            'content' => [$latestAnnouncement['content']],
        ]);
    }

    public function markAsSeen()
    {
        // CHANGED: Use the individual user's ID.
        // This marks the announcement as seen for the logged-in user only.
        $userId = session()->get('userId');
        $contentId = $this->request->getJSON()->content_id ?? null;

        if (!$contentId) {
            return $this->failValidationErrors('Content ID is required.');
        }

        $viewsModel = new UserContentViewsModel();
        
        $alreadyExists = $viewsModel->where('user_id', $userId)->where('content_id', $contentId)->first();
        if ($alreadyExists) {
            return $this->respond(['message' => 'Already marked as seen.']);
        }

        $viewsModel->insert([
            'user_id'    => $userId, // The record is saved with the correct individual ID
            'content_id' => $contentId,
            'viewed_at'  => date('Y-m-d H:i:s'),
        ]);

        return $this->respondCreated(['message' => 'Announcement marked as seen.']);
    }
}