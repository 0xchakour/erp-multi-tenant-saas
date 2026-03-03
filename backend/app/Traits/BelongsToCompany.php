<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToCompany
{
    protected static function bootBelongsToCompany()
    {
        static::addGlobalScope('company', function (Builder $builder) {

            if (Auth::check()) {
                $builder->where(
                    $builder->qualifyColumn('company_id'),
                    Auth::user()->company_id
                );
            }

        });

        static::creating(function ($model) {

            if (Auth::check()) {
                $model->company_id = Auth::user()->company_id;
            }

        });
    }
}
