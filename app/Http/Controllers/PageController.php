<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('Showcase', [
            'repos' => [
                'satellite' => 'https://github.com/adelinferaru/satellite',
                'nestedflowtracker' => 'https://github.com/adelinferaru/nestedflowtracker',
            ],
        ]);
    }

    public function live(): Response
    {
        return Inertia::render('Live');
    }

    public function distance(): Response
    {
        return Inertia::render('Distance');
    }

    public function history(): Response
    {
        return Inertia::render('History');
    }

    public function flows(): Response
    {
        return Inertia::render('Flows');
    }
}
