<?php

namespace App\Exceptions;

use Exception;

class InvalidInviteException extends Exception
{
    public static function expired(): self
    {
        return new self('This invite link has expired.');
    }

    public static function exhausted(): self
    {
        return new self('This invite link has reached its usage limit.');
    }
}
