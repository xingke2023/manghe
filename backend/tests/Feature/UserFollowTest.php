<?php

use App\Models\User;
use App\Models\UserFollow;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

function makeMember(): User
{
    return User::query()->create([
        'openid' => 'member_'.uniqid(),
        'nickname' => '会员用户',
        'is_member' => 1,
    ]);
}

function makeNonMember(): User
{
    return User::query()->create([
        'openid' => 'nonmember_'.uniqid(),
        'nickname' => '普通用户',
        'is_member' => 0,
    ]);
}

// ── POST /api/users/{id}/follow ────────────────────────────────────

it('member can follow another user', function () {
    $me = makeMember();
    $target = makeMember();

    $this->actingAs($me)
        ->postJson("/api/users/{$target->id}/follow")
        ->assertOk()
        ->assertJson(['message' => '关注成功']);

    expect(
        UserFollow::query()
            ->where('follower_id', $me->id)
            ->where('followee_id', $target->id)
            ->exists()
    )->toBeTrue();
});

it('non-member cannot follow', function () {
    $me = makeNonMember();
    $target = makeMember();

    $this->actingAs($me)
        ->postJson("/api/users/{$target->id}/follow")
        ->assertForbidden();
});

it('cannot follow yourself', function () {
    $me = makeMember();

    $this->actingAs($me)
        ->postJson("/api/users/{$me->id}/follow")
        ->assertUnprocessable()
        ->assertJson(['message' => '不能关注自己']);
});

it('cannot follow the same user twice', function () {
    $me = makeMember();
    $target = makeMember();

    UserFollow::query()->create(['follower_id' => $me->id, 'followee_id' => $target->id]);

    $this->actingAs($me)
        ->postJson("/api/users/{$target->id}/follow")
        ->assertUnprocessable()
        ->assertJson(['message' => '已关注']);
});

it('cannot follow more than 12 users', function () {
    $me = makeMember();

    for ($i = 0; $i < 12; $i++) {
        $u = User::query()->create(['openid' => 'extra_'.uniqid(), 'nickname' => 'u'.$i, 'is_member' => 0]);
        UserFollow::query()->create(['follower_id' => $me->id, 'followee_id' => $u->id]);
    }

    $thirteenth = makeMember();

    $this->actingAs($me)
        ->postJson("/api/users/{$thirteenth->id}/follow")
        ->assertUnprocessable()
        ->assertJson(['message' => '最多关注 12 人']);
});

// ── DELETE /api/users/{id}/follow ─────────────────────────────────

it('can unfollow a followed user', function () {
    $me = makeMember();
    $target = makeMember();

    UserFollow::query()->create(['follower_id' => $me->id, 'followee_id' => $target->id]);

    $this->actingAs($me)
        ->deleteJson("/api/users/{$target->id}/follow")
        ->assertOk()
        ->assertJson(['message' => '已取消关注']);

    expect(
        UserFollow::query()
            ->where('follower_id', $me->id)
            ->where('followee_id', $target->id)
            ->exists()
    )->toBeFalse();
});

it('returns error when unfollowing a non-followed user', function () {
    $me = makeMember();
    $target = makeMember();

    $this->actingAs($me)
        ->deleteJson("/api/users/{$target->id}/follow")
        ->assertUnprocessable()
        ->assertJson(['message' => '未关注该用户']);
});

it('requires authentication', function () {
    $target = makeMember();

    $this->postJson("/api/users/{$target->id}/follow")->assertUnauthorized();
    $this->deleteJson("/api/users/{$target->id}/follow")->assertUnauthorized();
});
