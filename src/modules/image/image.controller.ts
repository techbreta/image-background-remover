import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppiError from "../errors/ApiError";
import {

  removeBackgroundAndUploadFromUrl,
} from "./image.service";
import Semaphore from "./semaphore";

// Limit concurrent background-removal operations to avoid OOMs in constrained environments.
// Default concurrency is 1; override with BG_REMOVAL_CONCURRENCY env var.
const concurrency = process.env["BG_REMOVAL_CONCURRENCY"]
  ? parseInt(process.env["BG_REMOVAL_CONCURRENCY"] as string, 10)
  : 1;
const bgSemaphore = new Semaphore(isNaN(concurrency) ? 1 : concurrency);

export const removeBackground = catchAsync(
  async (req: Request, res: Response) => {
    const { imageUrl } = req.body;
    console.log("Received image URL:", imageUrl);

    if (!imageUrl) {
      throw new AppiError("imageUrl is required in request body", 400, {
        imageUrl: "imageUrl is required",
      });
    }

 

      const url = await bgSemaphore.run(() =>
        removeBackgroundAndUploadFromUrl(imageUrl),
      );
      return res.status(200).json({ url });
    

    // Otherwise stream the processed image back to the client as PNG
  
  },
);
