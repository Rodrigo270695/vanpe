<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeysCommand extends Command
{
    protected $signature = 'webpush:vapid';

    protected $description = 'Genera claves VAPID para notificaciones push y las muestra para .env';

    public function handle(): int
    {
        $keys = VAPID::createVapidKeys();

        $this->components->info('Añade estas variables a tu archivo .env:');
        $this->line('');
        $this->line('VAPID_PUBLIC_KEY='.$keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY='.$keys['privateKey']);
        $this->line('VAPID_SUBJECT=mailto:tu-correo@ejemplo.com');
        $this->line('');

        return self::SUCCESS;
    }
}
