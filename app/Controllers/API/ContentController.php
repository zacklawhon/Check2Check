<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\ContentModel;
use App\Models\UserContentViewsModel;
use CodeIgniter\API\ResponseTrait;

class ContentController extends BaseAPIController
{
    use ResponseTrait;

    // Fetches all active help documents
    public function getAllContent()
    {
        $contentModel = new ContentModel();
        $allContent = $contentModel->where('is_active', 1)->findAll();

        $keyedContent = [];
        foreach ($allContent as $item) {
            $keyedContent[$item['page_key']] = [
                'title' => $item['title'],
                // Storing content as an array of one item for consistency with the old static file
                'content' => [$item['content']] 
            ];
        }

        return $this->respond($keyedContent);
    }

    // Gets the latest unread announcement for the current user
    public function getLatestAnnouncement()
    {
        $userId = $this->getEffectiveUserId();
        $contentModel = new ContentModel();

        // 1. Find the most recent, active announcement
        $latestAnnouncement = $contentModel
            ->where('is_active', 1)
            ->where('is_announcement', 1)
            ->orderBy('created_at', 'DESC')
            ->first();

        if (!$latestAnnouncement) {
            return $this->respond(null); // No active announcements
        }

        // 2. Check if the user has already seen this announcement
        $viewsModel = new UserContentViewsModel();
        $hasSeen = $viewsModel
            ->where('user_id', $userId)
            ->where('content_id', $latestAnnouncement['id'])
            ->first();

        if ($hasSeen) {
            return $this->respond(null); // User has seen it
        }

        // 3. User has not seen it, return the announcement
        return $this->respond([
            'id'      => $latestAnnouncement['id'],
            'title'   => $latestAnnouncement['title'],
            'content' => [$latestAnnouncement['content']],
        ]);
    }

    // Marks an announcement as seen by the current user
    public function markAsSeen()
    {
        $userId = $this->getEffectiveUserId();
        $contentId = $this->request->getJSON()->content_id ?? null;

        if (!$contentId) {
            return $this->failValidationErrors('Content ID is required.');
        }

        $viewsModel = new UserContentViewsModel();
        
        // Avoid duplicate entries
        $alreadyExists = $viewsModel->where('user_id', $userId)->where('content_id', $contentId)->first();
        if ($alreadyExists) {
            return $this->respond(['message' => 'Already marked as seen.']);
        }

        $viewsModel->insert([
            'user_id'    => $userId,
            'content_id' => $contentId,
            'viewed_at'  => date('Y-m-d H:i:s'),
        ]);

        return $this->respondCreated(['message' => 'Announcement marked as seen.']);
    }
}