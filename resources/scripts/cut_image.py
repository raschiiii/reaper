import cv2
import os

#path = "../../assets/textures/terrain"
path = "img"


def divide(x, y, size):
    filename = f"{path}/tile_{x}_{y}.png"

    print(f"x={x}, y={y}, size={size}, {filename}")

    if (size > 512):
        offset = size // 4
        size = size // 2

        img = cv2.imread(filename)

        h = img.shape[0]//2
        w = img.shape[1]//2
        tiles = [img[x:x+h, y:y+w]
                 for x in range(0, img.shape[0], h) for y in range(0, img.shape[1], w)]

        xn = x + offset
        yn = y + offset
        cv2.imwrite(f"{path}/tile_{xn}_{yn}.png", tiles[3])
        divide(xn, yn, size)

        xn = x + offset
        yn = y - offset
        cv2.imwrite(f"{path}/tile_{xn}_{yn}.png", tiles[1])
        divide(xn, yn, size)

        xn = x - offset
        yn = y + offset
        cv2.imwrite(f"{path}/tile_{xn}_{yn}.png", tiles[2])
        divide(xn, yn, size)

        xn = x - offset
        yn = y - offset
        cv2.imwrite(f"{path}/tile_{xn}_{yn}.png", tiles[0])
        divide(xn, yn, size)


if __name__ == '__main__':
    size = 2**12
    print(size)
    os.system(f'copy .\\tile_0_0.png {path}\\')
    divide(0, 0, size)
