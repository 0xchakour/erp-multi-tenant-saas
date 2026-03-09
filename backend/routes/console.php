<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email? : Recipient email address}', function (?string $email = null) {
    $recipient = $email ? trim($email) : (string) config('mail.from.address');

    if ($recipient === '') {
        $this->error('Recipient email is required. Pass one explicitly or set MAIL_FROM_ADDRESS.');
        return self::FAILURE;
    }

    try {
        Mail::raw('Test email', function ($msg) use ($recipient) {
            $msg->to($recipient)
                ->subject('SMTP Test');
        });

        $this->info("SMTP test email sent to {$recipient}.");
        return self::SUCCESS;
    } catch (\Throwable $e) {
        Log::error('SMTP test email failed.', [
            'recipient' => $recipient,
            'mailer' => config('mail.default'),
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_port' => config('mail.mailers.smtp.port'),
            'mail_scheme' => config('mail.mailers.smtp.scheme'),
            'mail_encryption' => config('mail.mailers.smtp.encryption'),
            'exception_class' => $e::class,
            'exception_message' => $e->getMessage(),
            'exception' => $e,
        ]);

        $this->error('Failed to send test email. Check storage/logs/laravel.log for details.');
        return self::FAILURE;
    }
})->purpose('Send a raw test email to validate SMTP configuration.');
