<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TenantOwnerVerifyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $ownerName,
        public string $restaurantName,
        public string $subdomain,
        public string $verifyUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirma tu cuenta en VanPe — '.$this->restaurantName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tenant-owner-verify',
        );
    }
}
