<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlindBoxRequest extends FormRequest
{
    public function authorize(): bool
    {
        $blindBox = $this->route('blindBox');

        return $blindBox && $this->user()->id === $blindBox->creator_id;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'meeting_time' => ['sometimes', 'date', 'after:now'],
            'location' => ['sometimes', 'string', 'max:200'],
            'city' => ['sometimes', 'nullable', 'string', 'max:50'],
            'district' => ['sometimes', 'nullable', 'string', 'max:50'],
            'fee_type' => ['sometimes', 'integer', 'in:1,2'],
            'cover_image' => ['sometimes', 'nullable', 'string', 'max:500'],
            'expected_traits' => ['sometimes', 'nullable', 'array'],
            'experience_values' => ['sometimes', 'nullable', 'array'],
            'max_participants' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:20'],
        ];
    }
}
