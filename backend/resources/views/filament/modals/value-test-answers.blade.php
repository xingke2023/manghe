<div class="space-y-3 p-2">
    <div class="flex gap-3">
        <span class="font-medium text-gray-600 dark:text-gray-400">用户：</span>
        <span>{{ $record->user?->nickname ?? '-' }}</span>
    </div>
    <div class="flex gap-3">
        <span class="font-medium text-gray-600 dark:text-gray-400">风险题数：</span>
        <span class="{{ $record->risk_count >= 3 ? 'text-red-500 font-bold' : '' }}">{{ $record->risk_count }}</span>
    </div>
    @if($record->risk_questions)
    <div>
        <span class="font-medium text-gray-600 dark:text-gray-400">风险题目：</span>
        <span class="text-red-500">{{ implode(', ', $record->risk_questions) }}</span>
    </div>
    @endif
    <hr class="border-gray-200 dark:border-gray-700">
    <div>
        <p class="font-medium text-gray-600 dark:text-gray-400 mb-2">答题详情：</p>
        <div class="grid grid-cols-2 gap-2">
            @foreach($record->answers ?? [] as $q => $a)
            <div class="flex gap-2 rounded bg-gray-50 dark:bg-gray-800 px-3 py-1.5">
                <span class="text-gray-500">{{ strtoupper($q) }}：</span>
                <span class="font-medium">{{ $a }}</span>
            </div>
            @endforeach
        </div>
    </div>
    @if($record->review_note)
    <div>
        <p class="font-medium text-gray-600 dark:text-gray-400">审核备注：</p>
        <p class="text-sm mt-1">{{ $record->review_note }}</p>
    </div>
    @endif
</div>
