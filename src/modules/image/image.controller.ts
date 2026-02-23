import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppiError from "../errors/ApiError";
import {

  removeBackgroundAndUploadFromUrl,
} from "./image.service";


export const removeBackground = catchAsync(
  async (req: Request, res: Response) => {
    const { imageUrl } = req.body;
    console.log("Received image URL:", imageUrl);

    if (!imageUrl) {
      throw new AppiError("imageUrl is required in request body", 400, {
        imageUrl: "imageUrl is required",
      });
    }

 

      const url = await removeBackgroundAndUploadFromUrl(imageUrl);
     
      console.log("Background removal and upload successful, URL:", url);
       res.json({ url });
  },
);
