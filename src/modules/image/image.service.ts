import { Readable } from "stream";
import { URL } from "url";
import { img as uploadToCloudinary } from "../utils/cloudinary";
import { v2 as cloudinary } from "cloudinary";

const http = require("http");
const https = require("https");

async function fetchImageBuffer(
  imageUrl: string,
): Promise<{ buffer: Buffer; contentType?: string }> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(imageUrl);
      const lib = urlObj.protocol === "https:" ? https : http;
      lib
        .get(imageUrl, (resp: any) => {
          if (resp.statusCode && resp.statusCode >= 400) {
            return reject(
              new Error(`Failed to fetch image, status ${resp.statusCode}`),
            );
          }
          const chunks: Uint8Array[] = [];
          const headers = resp.headers || {};
          const contentType =
            (headers["content-type"] as string | undefined) ||
            (headers["Content-Type"] as string | undefined);
          resp.on("data", (c: Uint8Array) => chunks.push(c));
          resp.on("end", () => {
            const buf = Buffer.concat(chunks as Uint8Array[]);
            if (typeof contentType === "string") {
              resolve({ buffer: buf, contentType });
            } else {
              resolve({ buffer: buf });
            }
          });
        })
        .on("error", (err: Error) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

export async function removeBackgroundBufferFromUrl(
  imageUrl: string,
): Promise<Buffer> {
  // If configured to use Cloudinary for background removal, generate a
  // transformed Cloudinary URL (uses `background_removal` effect) and fetch
  // that image directly. This avoids native dependencies and heavy server-side
  // processing.
  const useCloudinary =
    typeof imageUrl === "string" && imageUrl.includes("res.cloudinary.com");

  const cloudinaryTransformation = [
    { effect: "background_removal" },
    { effect: "grayscale" },
  ];

  if (useCloudinary) {
    let transformedUrl: string;
    try {
      if (/^https?:\/\//i.test(imageUrl)) {
        // Remote/Cloudinary URL: use fetch delivery to apply transformation
        transformedUrl = cloudinary.url(imageUrl, {
          type: "fetch",
          secure: true,
          transformation: cloudinaryTransformation,
          format: "png",
        });
      } else {
        // Treat as a Cloudinary public_id
        transformedUrl = cloudinary.url(imageUrl, {
          secure: true,
          transformation: cloudinaryTransformation,
          format: "png",
        });
      }
      const { buffer: fetched } = await fetchImageBuffer(transformedUrl);
      return fetched;
    } catch (e) {
      console.warn("Cloudinary background removal failed, falling back:", e);
      // fallthrough to local/background-removal-node path
    }
  }

  const { buffer: inputBuffer } = await fetchImageBuffer(imageUrl);
  // Convert Node Buffer to Uint8Array for upload compatibility
  const uint8 = new Uint8Array(
    inputBuffer.buffer,
    inputBuffer.byteOffset,
    inputBuffer.byteLength,
  );

  try {
    let transformedUrl: string;
    if (
      typeof imageUrl === "string" &&
      imageUrl.includes("res.cloudinary.com")
    ) {
      // If it's a Cloudinary URL, use `fetch` delivery to transform it on-the-fly
      transformedUrl = cloudinary.url(imageUrl, {
        type: "fetch",
        secure: true,
        transformation: cloudinaryTransformation,
        format: "png",
      });
    } else {
      // Upload the buffer to Cloudinary then fetch a transformed delivery
      const uploadedUrl = await uploadToCloudinary(Buffer.from(uint8));
      if (!uploadedUrl) throw new Error("Cloudinary upload failed");
      transformedUrl = cloudinary.url(uploadedUrl, {
        type: "fetch",
        secure: true,
        transformation: cloudinaryTransformation,
        format: "png",
      });
    }

    const { buffer: outBuf } = await fetchImageBuffer(transformedUrl);
    return outBuf;
  } catch (e) {
    console.error("Cloudinary background removal failed:", e);
    throw e;
  }
}

/**
 * Upload a Buffer to Cloudinary using the `src/modules/utils/cloudinary.ts` helper.
 * Returns the uploaded image URL or throws on failure.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
): Promise<string> {
  const url = await uploadToCloudinary(buffer);
  if (!url) throw new Error("Failed to upload image to Cloudinary");
  return url;
}

/**
 * Convenience: remove background from a remote image URL and upload the
 * processed result to Cloudinary returning the secure url.
 */
export async function removeBackgroundAndUploadFromUrl(
  imageUrl: string,
): Promise<string> {
  const outBuffer = await removeBackgroundBufferFromUrl(imageUrl);
  const uploadedUrl = await uploadBufferToCloudinary(outBuffer);
  return uploadedUrl;
}

export function bufferToStream(buffer: Buffer): Readable {
  if (!buffer) throw new Error("No buffer provided to bufferToStream");
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer as any);
  return Readable.from(buffer);
}
