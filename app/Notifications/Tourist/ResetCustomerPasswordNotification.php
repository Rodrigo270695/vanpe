<?php

namespace App\Notifications\Tourist;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetCustomerPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $token,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $email = method_exists($notifiable, 'getEmailForPasswordReset')
            ? $notifiable->getEmailForPasswordReset()
            : (string) $notifiable->email;

        $url = rtrim((string) config('app.url'), '/').'/tourist/password-reset?'
            .http_build_query([
                'token' => $this->token,
                'email' => $email,
            ]);

        return (new MailMessage)
            ->subject('Restablecer contraseña — VanPe')
            ->greeting('Hola'.$this->greetingName($notifiable))
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta VanPe.')
            ->action('Restablecer contraseña', $url)
            ->line('Este enlace caduca en 60 minutos.')
            ->line('Si no solicitaste este cambio, puedes ignorar este correo.')
            ->line('También puedes usar el token en la app: '.$this->token);
    }

    private function greetingName(object $notifiable): string
    {
        $name = (string) ($notifiable->name ?? '');

        return $name !== '' ? ", {$name}" : '';
    }
}
