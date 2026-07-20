<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Invitación a un miembro del personal de un restaurante para que active su
 * cuenta definiendo su propia contraseña (enlace firmado).
 */
class StaffInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $staffName,
        public string $restaurantName,
        public string $roleLabel,
        public string $acceptUrl,
        public string $subdomainHost,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Te invitaron a '.$this->restaurantName.' en VanPe',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-invitation',
        );
    }
}
