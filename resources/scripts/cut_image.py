import cv2

path = "../../assets/textures/terrain"


def divide(x, y, size):
    filename = f"{path}/tile_{x}_{y}.png"

    print(f"x={x}, y={y}, size={size}, {filename}")

    if (size > 512):
        offset = size // 4
        size = size // 2

        img = cv2.imread(filename)

        height = img.shape[0]//2
        width = img.shape[1]//2
        tiles = [img[x:x+height, y:y+width]
                 for x in range(0, img.shape[0], height) for y in range(0, img.shape[1], width)]

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
    divide(0, 0, 2**10)
