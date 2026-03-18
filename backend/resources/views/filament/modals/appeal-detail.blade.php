<div class="space-y-4 p-2">
    <div class="grid grid-cols-2 gap-4">
        <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">申诉者</p>
            <p class="font-medium">{{ $record->appellant?->nickname ?? '-' }}</p>
        </div>
        <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">被申诉者</p>
            <p class="font-medium">{{ $record->respondent?->nickname ?? '-' }}</p>
        </div>
        <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">关联盲盒</p>
            <p class="font-medium">{{ $record->blindBox?->title ?? '-' }}</p>
        </div>
        <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">提交时间</p>
            <p class="font-medium">{{ $record->created_at?->format('Y-m-d H:i') ?? '-' }}</p>
        </div>
    </div>

    <hr class="border-gray-200 dark:border-gray-700">

    <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">申诉原因</p>
        <p class="text-sm bg-gray-50 dark:bg-gray-800 rounded p-3">{{ $record->reason }}</p>
    </div>

    @if($record->evidence_images && count($record->evidence_images) > 0)
    <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">证据图片（{{ count($record->evidence_images) }} 张）</p>
        <div class="flex flex-wrap gap-2">
            @foreach($record->evidence_images as $img)
            <a href="{{ $img }}" target="_blank">
                <img src="{{ $img }}" class="w-24 h-24 object-cover rounded border border-gray-200 dark:border-gray-700 hover:opacity-80" alt="证据图片">
            </a>
            @endforeach
        </div>
    </div>
    @endif

    @if($record->status === 2)
    <hr class="border-gray-200 dark:border-gray-700">
    <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">处理结果</p>
        <p class="font-medium">
            @php
                $results = [1 => '申诉成功', 2 => '申诉失败', 3 => '维持原判'];
            @endphp
            {{ $results[$record->review_result] ?? '-' }}
        </p>
    </div>
    @if($record->review_note)
    <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">处理说明</p>
        <p class="text-sm">{{ $record->review_note }}</p>
    </div>
    @endif
    @endif
</div>
