<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

/**
 * Usuario (personal) de un restaurante. Vive en el schema del tenant (rst_*).
 *
 * El search_path de la conexión 'tenant' debe estar fijado al schema correcto
 * antes de operar con este modelo (TenantProvisioner / middleware de subdominio).
 */
class User extends Authenticatable
{
    use HasRoles, Notifiable, SoftDeletes;

    protected $connection = 'tenant';

    protected $table = 'users';

    /**
     * Guard usado por Spatie para resolver roles/permisos del staff del tenant.
     */
    protected string $guard_name = 'web';

    protected $fillable = [
        'name',
        'first_name',
        'paternal_surname',
        'maternal_surname',
        'document_type',
        'document_number',
        'username',
        'email',
        'password',
        'telefono',
        'activo',
        'es_owner',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
            'es_owner' => 'boolean',
        ];
    }
}
