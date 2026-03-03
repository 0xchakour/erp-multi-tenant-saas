<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class Product extends Model
{
    use BelongsToCompany,LogsActivity;

    protected $fillable = [
        'name',
        'sku',
        'price',
    ];
}