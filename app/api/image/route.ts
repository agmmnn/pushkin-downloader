import axios from "axios";
import https from "https";
import sizeOf from "image-size";

const agent = new https.Agent({ rejectUnauthorized: true });
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const axiosWithSSL = axios.create({ httpsAgent });

// https://beta.nextjs.org/docs/routing/route-handlers

// https://catalog.shm.ru/entity/OBJECT/2137429

// https://collection.pushkinmuseum.art/en/entity/OBJECT/262426
// http://localhost:3000/api/image?url=https%3A%2F%2Fcollection.pushkinmuseum.art%2Fen%2Fentity%2FOBJECT%2F262426
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = decodeURIComponent(searchParams.get("url") as string);

  const response = await axiosWithSSL.get(url);
  const html = await response.data;
  const regex = /<meta property="og:image" content="(.*?)\?w=1000&amp;h=1000">/;
  const match = html.match(regex);
  if (match) {
    const imageUrl = match[1];
    const { width, height } = await getImageDimensions(
      imageUrl + "?w=2000&h=2000"
    );
    const tileSize = 512;
    const { wStep, hStep } = {
      wStep: parseInt(width / tileSize),
      hStep: parseInt(height / tileSize),
    };
    const { wMod, hMod } = {
      wMod: width % tileSize ? width % tileSize : 512,
      hMod: height % tileSize ? height % tileSize : 512,
    };
    let tileUrls = [];
    for (let i = 0; i < hStep + 1; i += 1) {
      for (let j = 0; j < wStep + 1; j += 1) {
        console.log(i, j);
        if (i === wStep && j === hStep) {
          tileUrls.push(
            imageUrl +
              `?w=2000&h=2000&cl=${i * tileSize}&ct=${
                j * tileSize
              }&cw=${wMod}&ch=${hMod}`
          );
        } else if (i === wStep) {
          tileUrls.push(
            imageUrl +
              `?w=2000&h=2000&cl=${i * tileSize}&ct=${
                j * tileSize
              }&cw=${wMod}&ch=512`
          );
        } else if (j === hStep) {
          tileUrls.push(
            imageUrl +
              `?w=2000&h=2000&cl=${i * tileSize}&ct=${
                j * tileSize
              }&cw=512&ch=${hMod}`
          );
        } else {
          tileUrls.push(
            imageUrl +
              `?w=2000&h=2000&cl=${i * tileSize}&ct=${
                j * tileSize
              }&cw=512&ch=512`
          );
        }
      }
    }
    console.log(tileUrls);
    console.log(tileUrls.length);

    return new Response(imageUrl);
  } else {
    console.log("unsuccess");
    return Response.json({ error: "not found" });
  }
}

async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  try {
    const response = await axiosWithSSL.get(url, {
      responseType: "arraybuffer",
    });
    const dimensions = sizeOf(response.data);
    return {
      width: dimensions.width as number,
      height: dimensions.height as number,
    };
  } catch (error) {
    console.error(error);
    return { width: -1, height: -1 };
  }
}
