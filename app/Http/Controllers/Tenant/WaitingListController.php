<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\SeatWaitingListRequest;
use App\Http\Requests\Tenant\StoreWaitingListRequest;
use App\Models\Tenant\WaitingList;
use App\Services\Tenant\WaitingListService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WaitingListController extends Controller
{
    public function __construct(
        private readonly WaitingListService $waitingList,
    ) {}

    public function store(StoreWaitingListRequest $request): RedirectResponse
    {
        $this->waitingList->add($request->validated());

        return back()->with('success', __('messages.lista_espera.added'));
    }

    public function seat(SeatWaitingListRequest $request, WaitingList $listaEspera): RedirectResponse
    {
        $this->waitingList->seat($listaEspera, (string) $request->validated('table_id'));

        return back()->with('success', __('messages.lista_espera.seated'));
    }

    public function withdraw(Request $request, WaitingList $listaEspera): RedirectResponse
    {
        abort_unless((bool) $request->user()?->can('tenant.reservations.manage'), 403);

        $this->waitingList->withdraw($listaEspera);

        return back()->with('success', __('messages.lista_espera.withdrawn'));
    }
}
