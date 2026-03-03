<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ClientController extends Controller
{
    use AuthorizesRequests;

    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    public function index()
    {
        $this->authorize('viewAny', Client::class);

        $clients = $this->clientService->getAll();

        return response()->json([
            'data' => $clients,
        ]);
    }

    public function show(Client $client)
    {
        $this->authorize('view', $client);

        return response()->json([
            'data' => $client,
        ]);
    }

    public function store(StoreClientRequest $request)
    {
        $this->authorize('create', Client::class);

        try {
            $client = $this->clientService->create($request->validated());

            return response()->json($client, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'CLIENT_CREATE_FAILED',
            ], 403);
        }
    }

    public function update(UpdateClientRequest $request, Client $client)
    {
        $this->authorize('update', $client);

        try {
            $updatedClient = $this->clientService->update($client, $request->validated());

            return response()->json($updatedClient);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'CLIENT_UPDATE_FAILED',
            ], 403);
        }
    }

    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);

        try {
            $this->clientService->delete($client);

            return response()->json([], 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'CLIENT_DELETE_FAILED',
            ], 403);
        }
    }
}
