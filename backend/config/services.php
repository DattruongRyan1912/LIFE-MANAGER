<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'llama3-70b-8192'),
        
        // FreeTier Pipeline Models
        'models' => [
            'reasoning' => env('GROQ_MODEL_REASONING', 'llama-3.3-70b-versatile'),
            'intent' => env('GROQ_MODEL_INTENT', 'groq/compound'),
            'rewriter' => env('GROQ_MODEL_REWRITER', 'llama-3.1-8b-instant'),
            'compressor' => env('GROQ_MODEL_COMPRESSOR', 'groq/compound-mini'),
            'formatter' => env('GROQ_MODEL_FORMATTER', 'allam-2-7b'),
        ],
    ],

];
