// https://beta.nextjs.org/docs/routing/route-handlers
import axios, { AxiosResponse } from "axios";
import https from "https";
import sizeOf from "image-size";
import Jimp from "jimp";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const axiosWithSSL = axios.create({ httpsAgent });

interface ImageDimensions {
  width: number;
  height: number;
}

const tileSize = 512;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = decodeURIComponent(searchParams.get("url") as string);

  const response: AxiosResponse<string> = await axiosWithSSL.get(url);
  const html: string = response.data;
  const regex = /<meta property="og:image" content="(.*?)\?w=1000&amp;h=1000/;
  const match = html.match(regex);
  if (match) {
    const imageUrl = match[1];
    console.log(imageUrl);
    const { width, height } = await getImageDimensions(
      imageUrl + "?w=2000&h=2000"
    );

    const wStep = Math.floor(width / tileSize);
    const hStep = Math.floor(height / tileSize);
    const wMod = width % tileSize;
    const hMod = height % tileSize;
    const tileUrls: string[] = [];

    for (let i = 0; i < hStep + 1; i += 1) {
      for (let j = 0; j < wStep + 1; j += 1) {
        const cw = j === wStep ? wMod : tileSize;
        const ch = i === hStep ? hMod : tileSize;
        if (cw !== 0 && ch !== 0) {
          tileUrls.push(
            `${imageUrl}?w=2000&h=2000&cl=${j * tileSize}&ct=${
              i * tileSize
            }&cw=${cw}&ch=${ch}`
          );
        }
      }
    }
    console.log(tileUrls);

    const imageBuffer = await getMergedImage(
      tileUrls,
      wStep + 1,
      hStep + 1,
      wMod,
      hMod
    );
    const headers = {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    return new Response(imageBuffer, { status: 200, headers: headers });
  } else {
    console.log("unsuccess");
    return new Response("not found", { status: 404 });
  }
}

async function getImageDimensions(url: string): Promise<ImageDimensions> {
  try {
    const response = await axiosWithSSL.get(url, {
      responseType: "arraybuffer",
    });
    const dimensions = sizeOf(response.data);
    if (dimensions.width && dimensions.height) {
      return { width: dimensions.width, height: dimensions.height };
    } else {
      return { width: -1, height: -1 };
    }
  } catch (error) {
    console.error(error);
    return { width: -1, height: -1 };
  }
}

async function getMergedImage(
  tileUrls: string[],
  columns: number,
  rows: number,
  cw: number,
  ch: number
): Promise<Buffer> {
  const tileImages = await Promise.all(
    tileUrls.map(async (url) => {
      const response = await axiosWithSSL.get(url, {
        responseType: "arraybuffer",
      });
      return await Jimp.read(response.data);
    })
  );

  const maxWidth = tileImages.reduce(
    (max, img) => Math.max(max, img.bitmap.width),
    0
  );
  const maxHeight = tileImages.reduce(
    (max, img) => Math.max(max, img.bitmap.height),
    0
  );
  const ratio = maxHeight / tileSize;

  const mergedImage = await new Jimp(maxWidth * columns, maxHeight * rows);

  let x = 0,
    y = 0;

  for (let i = 0; i < tileImages.length; i += 1) {
    mergedImage.composite(tileImages[i], x, y);
    x += maxWidth;
    if (i % columns === columns - 1) {
      x = 0;
      y += maxHeight;
    }
  }

  const croppedImage = mergedImage.crop(
    0,
    0,
    (columns - 1) * maxWidth + cw * ratio,
    (rows - 1) * maxHeight + ch * ratio
  );

  return await croppedImage.getBufferAsync(Jimp.MIME_PNG);
}

// 2000:0000 //0
// 4000:0000 //1
// 0000:2000 //3
// 2000:2000
// 4000:2000
// 0000:4000
// 2000:4000
// 4000:4000
// 0000:6000 //9  !
// 2000:6000 //10 !
// 4000:6000 //11 !
// 0000:8000 //12 !

// https://catalog.shm.ru/entity/OBJECT/2137429

// https://collection.pushkinmuseum.art/en/entity/OBJECT/77609
// http://localhost:3000/api/image?url=https%3A%2F%2Fcollection.pushkinmuseum.art%2Fen%2Fentity%2FOBJECT%2F77609

// https://collection.pushkinmuseum.art/en/entity/OBJECT/262426
// http://localhost:3000/api/image?url=https%3A%2F%2Fcollection.pushkinmuseum.art%2Fen%2Fentity%2FOBJECT%2F262426

//https://collection.pushkinmuseum.art/cross-search?query=art
//https://collection.pushkinmuseum.art/entity/OBJECT/787695?query=art&index=0
