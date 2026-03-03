<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class Client extends Model
{
    use SoftDeletes, BelongsToCompany,LogsActivity;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];
}