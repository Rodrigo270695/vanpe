<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdminCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'platform:superadmin
                            {--name= : Nombre del superadministrador}
                            {--username= : Usuario para iniciar sesión (username)}
                            {--email= : Correo del superadministrador}
                            {--password= : Contraseña}';

    /**
     * @var string
     */
    protected $description = 'Crea (o actualiza) el superadministrador de la plataforma y le asigna el rol superadmin (login por username o correo).';

    public function handle(): int
    {
        // 1) Asegurar permisos del catálogo y el rol superadmin (con todos) en public.
        $this->callSilent('db:seed', [
            '--class' => PermissionSeeder::class,
            '--force' => true,
        ]);

        $name = $this->option('name') ?: $this->ask('Nombre', 'Super Administrador');
        $username = Str::lower(trim((string) ($this->option('username') ?: $this->ask('Usuario (username)', 'superadmin'))));
        $email = Str::lower(trim((string) ($this->option('email') ?: $this->ask('Correo', 'superadmin@vanpe.com.pe'))));
        $password = (string) ($this->option('password') ?: $this->secret('Contraseña'));

        $validator = Validator::make(
            compact('name', 'username', 'email', 'password'),
            [
                'name' => ['required', 'string', 'max:255'],
                'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[a-z0-9._-]+$/'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'min:8'],
            ],
            [
                'username.regex' => 'El usuario solo admite minúsculas, números, punto, guion y guion bajo.',
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return self::FAILURE;
        }

        // Evitar colisiones de username/correo con OTRO usuario.
        $clash = User::query()
            ->where(fn ($q) => $q->where('username', $username)->orWhere('email', $email))
            ->get()
            ->first(fn (User $u) => $u->username === $username || $u->email === $email);

        $user = User::query()
            ->where('email', $email)
            ->orWhere('username', $username)
            ->first();

        if ($clash && $user && $clash->id !== $user->id) {
            $this->components->error('El usuario o correo ya pertenecen a cuentas distintas. Usa valores consistentes.');

            return self::FAILURE;
        }

        if ($user) {
            $user->fill([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make($password),
            ]);
            $user->email_verified_at ??= now();
            $user->save();
            $this->components->info("Superadministrador actualizado: {$username}");
        } else {
            $user = new User;
            $user->forceFill([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ])->save();
            $this->components->info("Superadministrador creado: {$username}");
        }

        if (! $user->hasRole('superadmin')) {
            $user->assignRole('superadmin');
        }

        $this->newLine();
        $this->table(['Campo', 'Valor'], [
            ['ID', $user->id],
            ['Nombre', $user->name],
            ['Usuario', $user->username],
            ['Correo', $user->email],
            ['Rol', 'superadmin'],
        ]);

        $this->components->info('Listo. Inicia sesión en el dominio central con tu usuario o correo.');

        return self::SUCCESS;
    }
}
