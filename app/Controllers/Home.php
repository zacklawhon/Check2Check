<?php

namespace App\Controllers;

class Home extends BaseController
{
     public function index(): string
    {
        // Serves the React app's main HTML file
        return file_get_contents(FCPATH . 'index.html');
    }
}
