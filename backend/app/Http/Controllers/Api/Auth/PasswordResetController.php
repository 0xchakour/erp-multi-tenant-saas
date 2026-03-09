<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyResetCodeRequest;
use App\Services\PasswordResetService;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    public function __construct(private readonly PasswordResetService $passwordResetService)
    {
    }

    public function sendResetCode(ForgotPasswordRequest $request)
    {
        try {
            $this->passwordResetService->sendResetCode(
                $request->validated('email'),
                (string) $request->ip()
            );

            return response()->json([
                'message' => 'Password reset code sent successfully.',
            ]);
        } catch (\RuntimeException $e) {
            $status = in_array($e->getCode(), [404, 422, 429, 500], true)
                ? $e->getCode()
                : 500;

            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PASSWORD_RESET_SEND_FAILED',
            ], $status);
        } catch (\Throwable $e) {
            Log::error('Unexpected error while sending password reset code.', [
                'email' => $request->input('email'),
                'ip_address' => (string) $request->ip(),
                'exception_class' => $e::class,
                'exception_message' => $e->getMessage(),
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Unable to send password reset code due to a server error.',
                'code' => 'PASSWORD_RESET_SEND_FAILED',
            ], 500);
        }
    }

    public function verifyCode(VerifyResetCodeRequest $request)
    {
        try {
            $validated = $request->validated();

            $this->passwordResetService->verifyCode(
                $validated['email'],
                $validated['code'],
                (string) $request->ip()
            );

            return response()->json([
                'message' => 'Verification code is valid.',
            ]);
        } catch (\RuntimeException $e) {
            $status = in_array($e->getCode(), [404, 422, 429], true)
                ? $e->getCode()
                : 422;

            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PASSWORD_RESET_VERIFY_FAILED',
            ], $status);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Unable to verify password reset code at the moment.',
                'code' => 'PASSWORD_RESET_VERIFY_FAILED',
            ], 500);
        }
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        try {
            $validated = $request->validated();

            $this->passwordResetService->resetPassword(
                $validated['email'],
                $validated['code'],
                $validated['new_password'],
                (string) $request->ip()
            );

            return response()->json([
                'message' => 'Password updated successfully. You can now sign in.',
            ]);
        } catch (\RuntimeException $e) {
            $status = in_array($e->getCode(), [404, 422, 429], true)
                ? $e->getCode()
                : 422;

            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PASSWORD_RESET_FAILED',
            ], $status);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Unable to reset password at the moment.',
                'code' => 'PASSWORD_RESET_FAILED',
            ], 500);
        }
    }
}
