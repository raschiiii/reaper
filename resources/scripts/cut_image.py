import cv2


def cut_image(filename, center, size):
    #img = cv2.imread(filename)
    # print(img.shape)
    #height = img.shape[0]//2
    #width = img.shape[1]//2
    # tiles = [img[x:x+height, y:y+width]
    #         for x in range(0, img.shape[0], height) for y in range(0, img.shape[1], width)]

    t1 = f"tile_{size/4}_{size/4}.png"
    print(t1)

    #cv2.imwrite(t1, tiles[0])

    '''
    i = 0
    for tile in tiles:
        cv2.imwrite(f"tile_{i}.png", tile)
        i += 1
    '''


def divide(x, y, size):
    filename = f"img/tile_{x}/{y}.png"

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
        cv2.imwrite(f"img/tile_{xn}/{yn}.png", tiles[1])
        divide(xn, yn, size)

        xn = x + offset
        yn = y - offset
        cv2.imwrite(f"img/tile_{xn}/{yn}.png", tiles[0])
        divide(xn, yn, size)

        xn = x - offset
        yn = y + offset
        cv2.imwrite(f"img/tile_{xn}/{yn}.png", tiles[3])
        divide(xn, yn, size)

        xn = x - offset
        yn = y - offset
        cv2.imwrite(f"img/tile_{xn}/{yn}.png", tiles[2])
        divide(xn, yn, size)


if __name__ == '__main__':
    divide(0, 0, 2**11)
