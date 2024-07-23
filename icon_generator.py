from PIL import Image, ImageDraw
import os

def create_icon(size):
    # 新しい画像を作成
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # 薄い色の定義（RGB形式）
    colors = [(100, 181, 246), (255, 241, 118), (255, 138, 128)]  # 薄い青、薄い黄、薄い赤
    
    # 色の幅を計算（青と赤を少し広く、黄色を狭く）
    total_width = size
    blue_width = (total_width + 2) // 3
    red_width = (total_width + 2) // 3
    yellow_width = total_width - blue_width - red_width
    
    widths = [blue_width, yellow_width, red_width]
    
    # 縦縞を描画
    x = 0
    for color, width in zip(colors, widths):
        draw.rectangle([x, 0, x + width - 1, size - 1], fill=color)
        x += width
    
    # 白い四角を3個描画
    square_size = max(size // 6, 1)  # 四角のサイズをアイコンサイズの1/6に設定（最小1ピクセル）
    y_position = size // 8  # 上端からアイコンサイズの1/8の位置に配置
    
    for _ in range(0,3):
        for i, width in enumerate(widths):
            x_center = sum(widths[:i]) + width // 2
            x_position = x_center - square_size // 2
            draw.rectangle([x_position, y_position, x_position + square_size - 1, y_position + square_size - 1], fill='white')
        y_position += square_size + max(square_size // 2,1)
    
    return img

def save_icon(img, size):
    # 保存するディレクトリを作成
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    # 画像を保存
    filename = f'icons/icon{size}.png'
    img.save(filename)
    print(f'Created {filename}')

def main():
    # 必要なサイズのアイコンを生成
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        save_icon(icon, size)

if __name__ == '__main__':
    main()