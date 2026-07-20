<?php

namespace App\Console\Commands;

use App\Services\Tenant\TenantProvisioner;
use Illuminate\Console\Command;

class TenantProvisionCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'tenant:provision
                            {--slug= : Subdominio del restaurante (ej. elcantaro)}
                            {--razon= : Razón social}
                            {--nombre= : Nombre comercial}
                            {--ruc= : RUC (11 dígitos, opcional)}
                            {--email= : Correo administrativo del restaurante}
                            {--owner-name= : Nombre del dueño}
                            {--owner-email= : Correo del dueño}
                            {--owner-password= : Contraseña del dueño}';

    /**
     * @var string
     */
    protected $description = 'Aprovisiona un restaurante: registro tenants + schema aislado + roles + usuario owner';

    public function handle(TenantProvisioner $provisioner): int
    {
        $slug = $this->option('slug') ?: $this->ask('Slug (subdominio)');
        $nombre = $this->option('nombre') ?: $this->ask('Nombre comercial');
        $razon = $this->option('razon') ?: $nombre;
        $email = $this->option('email') ?: $this->ask('Correo administrativo');
        $ownerName = $this->option('owner-name') ?: $this->ask('Nombre del dueño');
        $ownerEmail = $this->option('owner-email') ?: $email;
        $ownerPassword = $this->option('owner-password') ?: $this->secret('Contraseña del dueño');

        $this->components->info("Aprovisionando restaurante «{$nombre}» ({$slug})...");

        try {
            $tenant = $provisioner->provision([
                'slug' => $slug,
                'razon_social' => $razon,
                'nombre_comercial' => $nombre,
                'ruc' => $this->option('ruc'),
                'email_admin' => $email,
                'owner' => [
                    'name' => $ownerName,
                    'email' => $ownerEmail,
                    'password' => $ownerPassword,
                    'email_verified_at' => now(),
                ],
            ]);
        } catch (\Throwable $e) {
            $this->components->error($e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->table(['Campo', 'Valor'], [
            ['Tenant ID', $tenant->id],
            ['Slug', $tenant->slug],
            ['Schema', $tenant->schema_name],
            ['Subdominio', $tenant->subdomainHost()],
            ['Estado', $tenant->estado],
            ['Owner', "{$ownerName} <{$ownerEmail}>"],
        ]);

        $this->components->info('Restaurante aprovisionado correctamente.');

        return self::SUCCESS;
    }
}
