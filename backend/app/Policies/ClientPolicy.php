<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // both admin & employee
    }

    public function view(User $user, Client $client): bool
    {
        return $user->company_id === $client->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Client $client): bool
    {
        return $user->role === 'admin' && $user->company_id === $client->company_id;
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->role === 'admin' && $user->company_id === $client->company_id;
    }
}
