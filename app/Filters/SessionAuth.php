<?php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

class SessionAuth implements FilterInterface
{
    /**
     * This method is called before a controller is executed.
     * It checks if a user session exists and is valid.
     *
     * @param RequestInterface $request
     * @param array|null       $arguments
     *
     * @return mixed
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        $session = Services::session();

        // Check if 'isLoggedIn' and 'userId' exist in the session
        if (!$session->get('isLoggedIn') || !$session->get('userId')) {
            // If the user is not logged in, return a 401 Unauthorized response.
            // This prevents the controller from ever being reached.
            return Services::response()
                ->setJSON(['status' => 'error', 'message' => 'Access denied. User not logged in.'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // If the session is valid, do nothing and let the request continue to the controller.
    }

    /**
     * This method is called after a controller is executed.
     * We don't need to do anything here for this filter.
     *
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array|null        $arguments
     *
     * @return mixed
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No action needed after the controller runs.
    }
}
