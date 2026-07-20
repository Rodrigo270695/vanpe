<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VanPe — prueba push</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
        button { padding: 0.5rem 1rem; margin: 0 0.5rem 0.5rem 0; cursor: pointer; }
        pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 12px; white-space: pre-wrap; }
        .hint { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 1rem; margin: 1rem 0; font-size: 14px; }
        .hint ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }
    </style>
</head>
<body>
    <h1>Prueba push (aislada)</h1>
    <p>Diagnóstico sin React/Inertia. Si aquí falla, el problema es del navegador o del sistema, no de VanPe.</p>

    <button id="run-full">Probar con /sw.js (app)</button>
    <button id="run-minimal">Probar con /push-sw.js (mínimo)</button>
    <button id="clear">Borrar SW y recargar</button>

    <pre id="log"></pre>

    <div class="hint">
        <strong>Si ves <code>permission=denied</code> o <code>requestPermission=denied</code>:</strong>
        <ul>
            <li><strong>Brave:</strong> clic en el icono del león (Shields) en la barra de dirección → desactiva bloqueos para este sitio, o Configuración del sitio → Notificaciones → <strong>Permitir</strong>.</li>
            <li>Brave/Chrome → <code>brave://settings/content/notifications</code> (o <code>chrome://...</code>) → quita <code>negritalinda.localhost</code> de «No permitidos» y ponlo en «Permitidos».</li>
            <li>Windows → Configuración → Sistema → Notificaciones → activar para Brave/Chrome.</li>
            <li>Pulsa <strong>Borrar SW y recargar</strong>, recarga con Ctrl+F5 y vuelve a probar.</li>
        </ul>
        <strong>Si ves «push service error» con permiso granted:</strong>
        <ul>
            <li>Prueba en <strong>Firefox</strong> o en producción con <strong>HTTPS</strong>.</li>
            <li>Desactiva extensiones o usa ventana privada sin extensiones.</li>
        </ul>
    </div>

    <script>
        const vapidPublicKey = @json($vapidPublicKey);
        const logEl = document.getElementById('log');
        const log = (msg, ok = true) => {
            logEl.textContent += (ok ? '[OK] ' : '[ERR] ') + msg + '\n';
        };

        function urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const raw = atob(base64);
            const out = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
            return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
        }

        function logEnvironment() {
            log('origin=' + location.origin);
            log('secureContext=' + window.isSecureContext);
            log('permission=' + Notification.permission, Notification.permission !== 'denied');
            log('pushManager=' + ('PushManager' in window));
            log('vapid bytes=' + new Uint8Array(urlBase64ToUint8Array(vapidPublicKey)).byteLength);
            const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
            log('browser=' + (isBrave ? 'Brave' : 'Chromium/Chrome'));
            log('userAgent=' + navigator.userAgent.slice(0, 80) + '...');

            if (Notification.permission === 'denied') {
                log('Las notificaciones están BLOQUEADAS para este sitio. Sigue los pasos de abajo antes de probar.', false);
            }
        }

        async function runTest(swUrl) {
            logEl.textContent = '';
            logEnvironment();

            try {
                const perm = await Notification.requestPermission();
                log('requestPermission=' + perm, perm === 'granted');
                if (perm !== 'granted') return;

                const regs = await navigator.serviceWorker.getRegistrations();
                for (const r of regs) await r.unregister();
                log('cleared old service workers');

                const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });
                await navigator.serviceWorker.ready;
                log('registered ' + swUrl);
                log('sw active=' + Boolean(reg.active));
                log('controller=' + Boolean(navigator.serviceWorker.controller));

                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });
                log('subscribe OK');
                log('endpoint=' + sub.endpoint.slice(0, 72) + '...');
            } catch (e) {
                log((e && e.message) || String(e), false);
            }
        }

        document.getElementById('run-full').onclick = () => runTest('/sw.js');
        document.getElementById('run-minimal').onclick = () => runTest('/push-sw.js');
        document.getElementById('clear').onclick = async () => {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
            sessionStorage.clear();
            location.reload();
        };
    </script>
</body>
</html>
