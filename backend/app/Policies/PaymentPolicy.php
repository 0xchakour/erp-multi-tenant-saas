<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->company_id === $payment->company_id;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->role === 'admin' && $user->company_id === $payment->company_id;
    }
}
