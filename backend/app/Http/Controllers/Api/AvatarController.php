<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * 头像本地化。
 *
 * 之前前端直接把 api.dicebear.com 的地址当头像用（渲染时按 user id 拼，
 * 用户在资料页挑头像时也把外链存进 users.avatar_url），带来三个问题：
 *   1. 每次显示头像都要请求外域，小程序必须为此配 downloadFile 白名单
 *   2. dicebear 不可用时全站头像一起空白
 *   3. 前端取的是 SVG，而微信 <image> 在真机（尤其 iOS）渲染 SVG 不可靠
 *
 * 改成由服务端按 seed 拉 PNG 落盘缓存，之后一律走自己的域名。
 * 首次访问某个 seed 回源一次，后续直接读本地文件。
 */
class AvatarController extends Controller
{
    /** 缓存磁盘，storage/app/public 经 storage:link 对外可读 */
    private const DISK = 'public';

    private const DIR = 'avatars';

    /** 风格与背景色需与前端头像选择器一致，否则同一 seed 两边长得不一样 */
    private const STYLE = '9.x/open-peeps';

    private const SIZE = 256;

    private const BACKGROUNDS = 'ffd6c8,fce4d6,fff0e8,e8f4ff,d6f0e8,f0e8ff';

    /**
     * GET /api/avatar/{seed}
     *
     * seed 为数字（user id，或头像选择器里的种子值）。返回 PNG。
     * 同一 seed 的结果永不变化，所以给一年的不可变缓存头。
     */
    public function show(Request $request, string $seed): Response
    {
        // 只接受数字：既防路径穿越，也免得缓存目录被任意字符串塞满
        if (! preg_match('/^\d{1,12}$/', $seed)) {
            abort(404);
        }

        $path = self::DIR.'/'.$seed.'.png';
        $disk = Storage::disk(self::DISK);

        if (! $disk->exists($path)) {
            $binary = $this->fetchFromUpstream($seed);

            // 回源失败就直接报错，不要写入坏文件把错误缓存住
            if ($binary === null) {
                abort(502, '头像生成失败，请稍后重试');
            }

            $disk->put($path, $binary);
        }

        return response($disk->get($path), 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    /** 从 dicebear 取一张 PNG；失败返回 null */
    private function fetchFromUpstream(string $seed): ?string
    {
        $url = sprintf(
            'https://api.dicebear.com/%s/png?seed=%s&size=%d&backgroundColor=%s',
            self::STYLE,
            urlencode($seed),
            self::SIZE,
            self::BACKGROUNDS
        );

        try {
            $response = Http::timeout(10)->get($url);
        } catch (\Throwable $e) {
            report($e);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $body = $response->body();

        return $body === '' ? null : $body;
    }
}
