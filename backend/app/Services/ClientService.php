<?php

namespace App\Services;

use App\Models\Client;
use Illuminate\Support\Facades\Auth;

class ClientService
{
    public function getAll()
    {
        return Client::latest()->get();
    }

    public function create(array $data)
    {
        $user = Auth::user();
        $company = $user->company;
        $plan = $company->plan;

        // Enforce max_clients when the plan has a limit.
        if ($plan->max_clients !== null) {
            $currentClients = Client::count();

            if ($currentClients >= $plan->max_clients) {
                throw new \Exception("Client limit reached for your subscription plan.");
            }
        }

        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);

        return $client->fresh();
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }
}
