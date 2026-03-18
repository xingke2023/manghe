<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ValueTest;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ValueTestController extends Controller
{
    private const RISK_OPTIONS = [
        'q2' => ['A'],
        'q4' => ['A'],
        'q10' => ['A'],
    ];

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'answers' => ['required', 'array', 'size:10'],
            'answers.q1' => ['required', 'string'],
            'answers.q2' => ['required', 'string'],
            'answers.q3' => ['required', 'string'],
            'answers.q4' => ['required', 'string'],
            'answers.q5' => ['required', 'string'],
            'answers.q6' => ['required', 'string'],
            'answers.q7' => ['required', 'string'],
            'answers.q8' => ['required', 'string'],
            'answers.q9' => ['required', 'string'],
            'answers.q10' => ['required', 'string'],
        ]);

        $answers = $validated['answers'];
        $riskQuestions = [];

        foreach (self::RISK_OPTIONS as $qKey => $riskAnswers) {
            if (isset($answers[$qKey]) && in_array($answers[$qKey], $riskAnswers)) {
                $riskQuestions[] = $qKey;
            }
        }

        $riskCount = count($riskQuestions);
        $status = $riskCount === 0 ? 1 : 2; // 1=自动通过, 2=待人工审核

        ValueTest::query()->create([
            'user_id' => $user->id,
            'answers' => $answers,
            'risk_count' => $riskCount,
            'risk_questions' => $riskQuestions,
            'status' => $status,
        ]);

        $user->update(['has_box_permission' => $status === 1 ? 1 : 2]);

        if ($status === 1) {
            NotificationService::send(
                userId: $user->id,
                type: 'value_test_approved',
                title: '价值观审核通过',
                content: '恭喜！你已通过价值观测试，现在可以缴纳保证金发布盲盒了',
                linkUrl: '/publish',
            );
        }

        return response()->json([
            'status' => $status,
            'message' => $status === 1 ? '恭喜通过测试！' : '已提交审核，请等待24小时',
        ]);
    }
}
