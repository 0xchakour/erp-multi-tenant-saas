<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    protected static function bootLogsActivity()
    {
        static::created(function ($model) {
            self::logAction('created', $model);
        });

        static::updated(function ($model) {
            self::logAction('updated', $model);
        });

        static::deleted(function ($model) {
            self::logAction('deleted', $model);
        });
    }

    protected static function logAction(string $action, $model)
    {
        if (!Auth::check()) {
            return;
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => class_basename($model),
            'model_id' => $model->id,
        ]);
    }
}