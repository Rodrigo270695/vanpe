<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class QueuedTenantResetPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $token,
        public readonly string $resetUrl,
        public readonly string $recipientName,
    ) {
        $this->onQueue('mail');
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('messages.auth.reset_title').' — VanPe')
            ->greeting(__('messages.auth.email_greeting', [
                'name' => $this->recipientName,
            ]))
            ->line(__('messages.auth.forgot_subtitle'))
            ->action(__('messages.auth.reset_submit'), $this->resetUrl)
            ->line(__('passwords.sent'));
    }
}
