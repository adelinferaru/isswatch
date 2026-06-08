<?php

namespace App\Services;

use RuntimeException;

/**
 * Thrown when the upstream satellite API returns a non-success envelope
 * (422 validation, 502 upstream failure, transport error, ...). Carries the
 * validation errors map and the HTTP status so controllers can relay them.
 */
class SatelliteException extends RuntimeException
{
    /**
     * @param  array<string, array<int, string>>  $errors
     */
    public function __construct(
        string $message,
        public readonly array $errors = [],
        public readonly int $status = 502,
    ) {
        parent::__construct($message);
    }
}
