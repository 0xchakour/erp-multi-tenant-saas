<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->company_id === $invoice->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->role === 'admin' && $user->company_id === $invoice->company_id;
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->role === 'admin' && $user->company_id === $invoice->company_id;
    }
}
