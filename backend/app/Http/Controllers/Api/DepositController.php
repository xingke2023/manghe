<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepositController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $alreadyPaid = Deposit::query()
            ->where('user_id', $user->id)
            ->where('deposit_type', 1)
            ->where('payment_status', 2)
            ->exists();

        if ($alreadyPaid) {
            return response()->json(['message' => '已缴纳保证金']);
        }

        Deposit::query()->create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'type' => 1,
            'deposit_type' => 1,
            'payment_status' => 2,
            'note' => '发盒保证金',
        ]);

        return response()->json(['message' => '缴纳成功'], 201);
    }
}
