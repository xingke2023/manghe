<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Login or register by phone number (mock, no SMS verification for now).
     */
    public function login(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $user = User::query()->firstOrCreate(
            ['phone' => $request->phone],
            ['nickname' => '用户'.substr($request->phone, -4)]
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Dev-only: login as a specific user by ID (for testing).
     */
    public function loginAsUser(Request $request)
    {
        if (app()->isProduction()) {
            abort(404);
        }

        $request->validate(['user_id' => ['required', 'integer']]);
        $user = User::query()->findOrFail($request->user_id);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }
}
