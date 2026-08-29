#!/usr/bin/env python3
"""生成 tabBar 轮廓图标。

从 Taro 版搬过来的那 6 个图标是 1×1 的透明占位图，所以底部只显示文字、
图标位置一片空白。这里用 Pillow 描线画线框（轮廓）风格图标。

关于格式：微信 tabBar 的 iconPath **不支持 SVG**，只能是 PNG/JPG，
所以这里直接产出 PNG。本脚本即图标的唯一来源 —— 要改颜色、线宽或形状
就改下面的常量/坐标后重跑，不额外维护一份容易走样的 SVG。

微信建议尺寸 81×81。为了让斜线和圆角平滑，先在 4 倍画布上绘制再降采样。

用法：python3 tools/make-tab-icons.py
"""
import os

from PIL import Image, ImageDraw

OUT_SIZE = 81
SCALE = 4
S = OUT_SIZE * SCALE  # 324

# 颜色取自 app.json 的 tabBar 配置，两处要保持一致
NORMAL = '#999999'   # tabBar.color
ACTIVE = '#E8373F'   # tabBar.selectedColor

# 4 倍画布上的线宽，降采样后约 5.5px —— 小尺寸下看得清又不显笨重
W = 22

OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'images'
)


def stroke(draw, points, color, width=W):
    """画折线。joint='curve' 让转角圆滑，避免斜线接缝出现缺口"""
    draw.line(points, fill=color, width=width, joint='curve')
    # Pillow 的 line 不给线端加圆头，两端补小圆点，避免斜线端点看起来被切平
    r = width // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def draw_home(draw, color):
    """首页：房子线框 —— 屋顶折线 + 三面墙 + 门"""
    # 屋顶
    stroke(draw, [(30, 170), (162, 56), (294, 170)], color)
    # 左墙 → 地面 → 右墙（一条折线画完，转角自动圆滑）
    stroke(draw, [(70, 162), (70, 270), (254, 270), (254, 162)], color)
    # 门
    stroke(draw, [(140, 270), (140, 210), (184, 210), (184, 270)], color)


def draw_messages(draw, color):
    """消息：对话气泡线框 —— 圆角矩形 + 左下角尾巴"""
    draw.rounded_rectangle(
        [34, 60, 290, 220], radius=48, outline=color, width=W
    )
    # 尾巴只画外侧两段，与气泡相接的那一边留空，才像标准聊天图标
    stroke(draw, [(106, 212), (106, 286), (166, 218)], color)


def draw_profile(draw, color):
    """我的：人像线框 —— 圆头 + 肩部弧线"""
    draw.ellipse([114, 46, 210, 142], outline=color, width=W)
    # 上半椭圆弧当肩膀，两端开口是线框人像图标的常见处理
    draw.arc([52, 176, 272, 348], start=180, end=360, fill=color, width=W)


ICONS = {
    'tab-home': draw_home,
    'tab-messages': draw_messages,
    'tab-profile': draw_profile,
}


def render(draw_fn, color, path):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(img), color)
    img.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS).save(path)
    return os.path.getsize(path)


def main():
    for name, fn in ICONS.items():
        for suffix, color in (('', NORMAL), ('-active', ACTIVE)):
            path = os.path.join(OUT_DIR, f'{name}{suffix}.png')
            size = render(fn, color, path)
            print(f'  {name}{suffix}.png  {OUT_SIZE}x{OUT_SIZE}  {size} bytes')
    print(f'\n✓ 6 个图标已写入 {OUT_DIR}')


if __name__ == '__main__':
    main()
