// https://beta.nextjs.org/docs/routing/route-handlers
import axios, { AxiosResponse } from "axios";
import https from "https";
import Jimp from "jimp";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const axiosWithSSL = axios.create({ httpsAgent });

const tileSize = 512;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = decodeURIComponent(searchParams.get("url") as string);

  const response: AxiosResponse<string> = await axiosWithSSL.get(url);
  const html: string = response.data;
  const regex = /<meta property="og:image" content="(.*?)\?w=1000&amp;h=1000/;
  const match = html.match(regex);
  if (match) {
    const imageUrl: string = match[1];
    const { width, height } = await getImageDimensions(imageUrl);

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
    console.log(tileUrls.length);

    const imageBuffer = await getMergedImage(
      tileUrls,
      wStep + 1,
      hStep + 1,
      wMod,
      hMod
    );
    const headers = {
      "Content-Type": "image/png",
    };

    return new Response(imageBuffer, { status: 200, headers: headers });
  } else {
    console.log("unsuccess");
    return new Response("not found", { status: 404 });
  }
}

async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  const response = await axiosWithSSL.get(url.replace(".jpg", ".json"));
  const { width, height } = response.data;
  return { width: width, height: height };
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

// https://catalog.shm.ru/entity/OBJECT/2117418?fund_ier=647759298&index=33
// https://catalog.shm.ru/entity/OBJECT/2137429

// https://collection.pushkinmuseum.art/en/entity/OBJECT/77609
// http://localhost:3000/api/image?url=https%3A%2F%2Fcollection.pushkinmuseum.art%2Fen%2Fentity%2FOBJECT%2F77609

// https://collection.pushkinmuseum.art/en/entity/OBJECT/262426
// http://localhost:3000/api/image?url=https%3A%2F%2Fcollection.pushkinmuseum.art%2Fen%2Fentity%2FOBJECT%2F262426

//https://collection.pushkinmuseum.art/cross-search?query=art
//https://collection.pushkinmuseum.art/entity/OBJECT/787695?query=art&index=0
