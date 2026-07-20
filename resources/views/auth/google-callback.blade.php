<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google · VanPe</title>
    <style>
        body {
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Segoe UI, Roboto, Arial, sans-serif;
            background: #0744a9;
            color: #fff;
        }
        .box { text-align: center; }
        .spinner {
            width: 34px; height: 34px; margin: 0 auto 14px;
            border: 3px solid rgba(255,255,255,.3);
            border-top-color: #f79210;
            border-radius: 50%;
            animation: spin .8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="box">
        <div class="spinner"></div>
        <p>Conectando con Google…</p>
    </div>
    <script>
        (function () {
            var payload = Object.assign({ source: 'vanpe-google' }, @json($payload));

            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(payload, window.location.origin);
                window.close();
                return;
            }

            // Sin ventana emergente (popup bloqueado o navegación directa): fallback normal.
            window.location.href = payload.status === 'success'
                ? (payload.redirect || '/')
                : '/login';
        })();
    </script>
</body>
</html>
