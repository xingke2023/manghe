<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublishController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        $hasDeposit = Deposit::query()
            ->where('user_id', $user->id)
            ->where('deposit_type', 1)
            ->where('payment_status', 2)
            ->exists();

        return response()->json([
            'value_test_status' => $user->has_box_permission, // 0=未测试,1=通过,2=审核中
            'has_deposit' => $hasDeposit,
        ]);
    }
}
