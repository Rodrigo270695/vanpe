<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta</title>
</head>
<body style="margin:0;padding:0;background:#eef2fb;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2fb;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(7,68,169,.12);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0744a9,#052f78);padding:28px 32px;">
                            <span style="font-size:22px;font-weight:800;color:#ffffff;">Van<span style="color:#f79210;">Pe</span></span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 8px;font-size:22px;color:#0744a9;">¡Hola, {{ $ownerName }}!</h1>
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Gracias por registrar <strong>{{ $restaurantName }}</strong> en VanPe.
                                Confirma tu correo para activar tu cuenta y empezar a configurar tu restaurante.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                <tr>
                                    <td style="border-radius:14px;background:#f79210;">
                                        <a href="{{ $verifyUrl }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                                            Confirmar mi correo
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                                Tu panel estará disponible en:
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#0744a9;">
                                {{ $subdomain }}
                            </p>

                            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <span style="color:#0744a9;word-break:break-all;">{{ $verifyUrl }}</span>
                            </p>
                            <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                                Este enlace expira en 60 minutos. Si no creaste esta cuenta, ignora este mensaje.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 32px;background:#f7f9fe;font-size:12px;color:#9ca3af;">
                            © {{ date('Y') }} VanPe — Perú
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
