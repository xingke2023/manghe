<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoxVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        $voucher = BoxVoucher::query()
            ->where('voucher_code', $validated['code'])
            ->where('status', 1) // 1=可用
            ->first();

        if (! $voucher) {
            return response()->json(['message' => '凭证无效或已被使用，请重试'], 422);
        }

        $voucher->update([
            'status' => 2, // 2=已使用
            'used_by' => $user->id,
            'used_at' => now(),
        ]);

        return response()->json(['message' => '凭证核销成功']);
    }
}
