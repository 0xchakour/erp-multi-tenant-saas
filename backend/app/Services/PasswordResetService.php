<?php

namespace App\Services;

use App\Mail\SendResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class PasswordResetService
{
    private const CODE_TTL_MINUTES = 10;
    private const CODE_LENGTH = 6;
    private const MAX_INVALID_ATTEMPTS = 5;

    public function sendResetCode(string $email, string $ipAddress): void
    {
        $normalizedEmail = $this->normalizeEmail($email);

        $this->deleteExpiredCodes();

        if (!User::query()->where('email', $normalizedEmail)->exists()) {
            throw new \RuntimeException('No account was found for the provided email.', 404);
        }

        $plainCode = $this->generateCode();

        PasswordResetCode::query()->updateOrCreate(
            ['email' => $normalizedEmail],
            [
                'code' => Hash::make($plainCode),
                'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
                'created_at' => now(),
            ]
        );

        $this->clearVerifyAttempts($normalizedEmail, $ipAddress);

        try {
            Mail::to($normalizedEmail)->send(new SendResetCodeMail($plainCode));
        } catch (\Throwable $e) {
            Log::error('Failed to send password reset code email.', [
                'email' => $normalizedEmail,
                'ip_address' => $ipAddress,
                'mailer' => config('mail.default'),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
                'mail_scheme' => config('mail.mailers.smtp.scheme'),
                'mail_encryption' => config('mail.mailers.smtp.encryption'),
                'exception_class' => $e::class,
                'exception_message' => $e->getMessage(),
                'exception' => $e,
            ]);

            $exceptionMessage = mb_strtolower($e->getMessage());
            $message = 'Unable to send reset code email at the moment.';

            if ($e instanceof TransportExceptionInterface) {
                $message = str_contains($exceptionMessage, '535')
                    || str_contains($exceptionMessage, 'badcredentials')
                    ? 'Gmail SMTP authentication failed. Please use a valid Gmail App Password.'
                    : 'Unable to send reset code email due to an SMTP configuration issue.';
            }

            throw new \RuntimeException($message, 500, $e);
        }
    }

    public function verifyCode(string $email, string $code, string $ipAddress): void
    {
        $normalizedEmail = $this->normalizeEmail($email);

        $this->deleteExpiredCodes();
        $this->ensureAttemptsRemaining($normalizedEmail, $ipAddress);

        $resetCode = $this->findValidResetCode($normalizedEmail);

        if (!$resetCode || !Hash::check($code, $resetCode->code)) {
            $this->recordInvalidAttempt($normalizedEmail, $ipAddress);
            throw new \RuntimeException('Invalid or expired verification code.', 422);
        }

        $this->clearVerifyAttempts($normalizedEmail, $ipAddress);
    }

    public function resetPassword(string $email, string $code, string $newPassword, string $ipAddress): void
    {
        $normalizedEmail = $this->normalizeEmail($email);

        $this->verifyCode($normalizedEmail, $code, $ipAddress);

        $updatedCount = User::query()
            ->where('email', $normalizedEmail)
            ->update([
                'password' => Hash::make($newPassword),
            ]);

        if ($updatedCount === 0) {
            throw new \RuntimeException('No account was found for the provided email.', 404);
        }

        PasswordResetCode::query()->where('email', $normalizedEmail)->delete();
        $this->clearVerifyAttempts($normalizedEmail, $ipAddress);
    }

    private function findValidResetCode(string $email): ?PasswordResetCode
    {
        return PasswordResetCode::query()
            ->where('email', $email)
            ->where('expires_at', '>', now())
            ->first();
    }

    private function deleteExpiredCodes(): void
    {
        PasswordResetCode::query()
            ->where('expires_at', '<=', now())
            ->delete();
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, (10 ** self::CODE_LENGTH) - 1), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function ensureAttemptsRemaining(string $email, string $ipAddress): void
    {
        $key = $this->attemptKey($email, $ipAddress);

        if (RateLimiter::tooManyAttempts($key, self::MAX_INVALID_ATTEMPTS)) {
            throw new \RuntimeException(
                'Too many invalid verification attempts. Please request a new code.',
                429
            );
        }
    }

    private function recordInvalidAttempt(string $email, string $ipAddress): void
    {
        RateLimiter::hit($this->attemptKey($email, $ipAddress), self::CODE_TTL_MINUTES * 60);
    }

    private function clearVerifyAttempts(string $email, string $ipAddress = ''): void
    {
        RateLimiter::clear($this->attemptKey($email, $ipAddress));
    }

    private function attemptKey(string $email, string $ipAddress): string
    {
        return 'password-reset-verify|' . $email . '|' . $ipAddress;
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
