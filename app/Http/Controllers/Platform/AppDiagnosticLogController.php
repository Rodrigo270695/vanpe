<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\AppDiagnosticLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppDiagnosticLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->can('tenants.view'), 403);

        $level = $request->string('level')->toString();
        $event = $request->string('event')->toString();
        $deviceId = $request->string('device_id')->toString();

        $logs = AppDiagnosticLog::query()
            ->with(['customer:id,name,email'])
            ->when($level !== '', fn ($q) => $q->where('level', $level))
            ->when($event !== '', fn ($q) => $q->where('event', 'like', '%'.$event.'%'))
            ->when($deviceId !== '', fn ($q) => $q->where('device_id', $deviceId))
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn (AppDiagnosticLog $log): array => [
                'id' => $log->id,
                'device_id' => $log->device_id,
                'session_id' => $log->session_id,
                'level' => $log->level,
                'event' => $log->event,
                'message' => $log->message,
                'app_version' => $log->app_version,
                'platform' => $log->platform,
                'os_version' => $log->os_version,
                'payload' => $log->payload,
                'customer' => $log->customer ? [
                    'id' => $log->customer->id,
                    'name' => $log->customer->name,
                    'email' => $log->customer->email,
                ] : null,
                'created_at' => $log->created_at?->timezone('America/Lima')->toIso8601String(),
            ]);

        return Inertia::render('app-diagnostics/index', [
            'logs' => $logs,
            'filters' => [
                'level' => $level,
                'event' => $event,
                'device_id' => $deviceId,
            ],
        ]);
    }

    public function destroy(Request $request, AppDiagnosticLog $app_diagnostic_log): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenants.view'), 403);
        $app_diagnostic_log->delete();

        return back()->with('success', 'Log eliminado.');
    }

    public function clear(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenants.view'), 403);
        AppDiagnosticLog::query()->where('created_at', '<', now()->subDays(14))->delete();

        return back()->with('success', 'Logs de más de 14 días eliminados.');
    }
}
