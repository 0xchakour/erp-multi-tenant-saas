<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Http\Request;
use App\Services\AuthService;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request)
    {
        try {
            $result = $this->authService->register($request->validated());

            return response()->json([
                'message' => 'Registration successful',
                'token' => $result['token'],
                'user' => $result['user'],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'REGISTER_FAILED',
            ], 500);
        }
    }
    public function login(LoginRequest $request)
    {
        try {
            $result = $this->authService->login($request->validated());

            return response()->json([
                'message' => 'Login successful',
                'token' => $result['token'],
                'user' => $result['user'],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'AUTH_CONTEXT_REQUIRED',
            ], 422);
        } catch (\RuntimeException $e) {
            $status = str_contains(strtolower($e->getMessage()), 'subscription inactive')
                ? 403
                : 401;

            return response()->json([
                'message' => $e->getMessage(),
                'code' => $status === 403 ? 'AUTH_SUBSCRIPTION_INACTIVE' : 'AUTH_FAILED',
            ], $status);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'AUTH_FAILED',
            ], 401);
        }
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json(
            $user?->load('company.plan')
        );
    }
}
