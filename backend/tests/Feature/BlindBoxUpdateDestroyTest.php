<?php

use App\Models\BlindBox;
use App\Models\BoxApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

function makeUser(): User
{
    return User::query()->create([
        'openid' => 'test_'.uniqid(),
        'nickname' => 'Test User',
    ]);
}

function makeBlindBox(User $creator, array $overrides = []): BlindBox
{
    $meetingTime = now()->addDays(3);

    return BlindBox::query()->create(array_merge([
        'creator_id' => $creator->id,
        'title' => '测试盲盒',
        'meeting_time' => $meetingTime,
        'location' => '上海市中心',
        'city' => '上海',
        'fee_type' => 1,
        'status' => 1,
        'checkin_start_time' => $meetingTime->copy()->subHours(3),
        'checkin_end_time' => $meetingTime->copy()->addHours(2),
        'expired_at' => $meetingTime->copy()->addHours(2),
    ], $overrides));
}

// ── PUT /api/blind-boxes/{id} ──────────────────────────────────────

it('creator can update an active blind box', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator);

    $response = $this->actingAs($creator)
        ->putJson("/api/blind-boxes/{$blindBox->id}", [
            'title' => '新标题',
            'location' => '新地址',
        ]);

    $response->assertOk()->assertJson(['message' => '更新成功']);
    expect($blindBox->fresh()->title)->toBe('新标题');
});

it('non-creator cannot update a blind box', function () {
    $creator = makeUser();
    $other = makeUser();
    $blindBox = makeBlindBox($creator);

    $this->actingAs($other)
        ->putJson("/api/blind-boxes/{$blindBox->id}", ['title' => '篡改'])
        ->assertForbidden();
});

it('cannot update a blind box that is not active', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator, ['status' => 3]);

    $this->actingAs($creator)
        ->putJson("/api/blind-boxes/{$blindBox->id}", ['title' => '新标题'])
        ->assertUnprocessable();
});

it('updating meeting_time recalculates checkin window', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator);
    $newTime = now()->addDays(5)->toDateTimeString();

    $this->actingAs($creator)
        ->putJson("/api/blind-boxes/{$blindBox->id}", ['meeting_time' => $newTime])
        ->assertOk();

    $fresh = $blindBox->fresh();
    expect((int) $fresh->checkin_start_time->diffInHours($fresh->meeting_time))->toBe(3);
});

// ── DELETE /api/blind-boxes/{id} ──────────────────────────────────

it('creator can take down an active blind box', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator);

    $this->actingAs($creator)
        ->deleteJson("/api/blind-boxes/{$blindBox->id}")
        ->assertOk()->assertJson(['message' => '已下架']);

    expect($blindBox->fresh()->status)->toBe(3);
});

it('non-creator cannot take down a blind box', function () {
    $creator = makeUser();
    $other = makeUser();
    $blindBox = makeBlindBox($creator);

    $this->actingAs($other)
        ->deleteJson("/api/blind-boxes/{$blindBox->id}")
        ->assertForbidden();
});

it('cannot take down a blind box that is already closed', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator, ['status' => 3]);

    $this->actingAs($creator)
        ->deleteJson("/api/blind-boxes/{$blindBox->id}")
        ->assertUnprocessable();
});

it('cannot take down a blind box with a locked application', function () {
    $creator = makeUser();
    $applicant = makeUser();
    $blindBox = makeBlindBox($creator);

    BoxApplication::query()->create([
        'box_id' => $blindBox->id,
        'applicant_id' => $applicant->id,
        'is_locked' => true,
        'status' => 2,
        'payment_status' => 2,
        'anti_flake_fee' => 0,
    ]);

    $this->actingAs($creator)
        ->deleteJson("/api/blind-boxes/{$blindBox->id}")
        ->assertUnprocessable()
        ->assertJson(['message' => '已锁定报名者，无法下架']);
});

it('requires authentication for update and destroy', function () {
    $creator = makeUser();
    $blindBox = makeBlindBox($creator);

    $this->putJson("/api/blind-boxes/{$blindBox->id}", ['title' => 'x'])->assertUnauthorized();
    $this->deleteJson("/api/blind-boxes/{$blindBox->id}")->assertUnauthorized();
});
