<?php

namespace App\Models;

use App\Notifications\Tourist\ResetCustomerPasswordNotification;
use Database\Factories\CustomerFactory;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * Identidad global del turista (schema public). Separada de User (staff/superadmin).
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $avatar_url
 * @property string|null $password
 * @property string|null $google_id
 * @property string $status
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $last_login_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
class Customer extends Authenticatable implements CanResetPasswordContract
{
    /** @use HasFactory<CustomerFactory> */
    use CanResetPassword, HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_BLOCKED = 'blocked';

    public const TOKEN_ABILITY = 'tourist-app';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar_url',
        'password',
        'google_id',
        'status',
        'email_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isBlocked(): bool
    {
        return $this->status === self::STATUS_BLOCKED;
    }

    public function hasPassword(): bool
    {
        return filled($this->password);
    }

    public function markLogin(): void
    {
        $this->forceFill(['last_login_at' => now()])->save();
    }

    /**
     * Broker de recuperación propio (no el de User/staff).
     */
    public function getEmailForPasswordReset(): string
    {
        return $this->email;
    }

    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetCustomerPasswordNotification((string) $token));
    }
}
