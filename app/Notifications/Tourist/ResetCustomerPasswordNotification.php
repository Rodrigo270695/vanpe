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
        return (new MailMessage)
            ->subject('Código para restablecer contraseña — VanPe')
            ->greeting('Hola'.$this->greetingName($notifiable))
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta VanPe.')
            ->line('Usa este código en la app VanPe:')
            ->line('**'.$this->token.'**')
            ->line('El código caduca en 60 minutos.')
            ->line('Si no solicitaste este cambio, puedes ignorar este correo.')
            ->salutation('Equipo VanPe');
    }

    private function greetingName(object $notifiable): string
    {
        $name = (string) ($notifiable->name ?? '');

        return $name !== '' ? ", {$name}" : '';
    }
}
