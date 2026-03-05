import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppiError from "../errors/ApiError";
import {
  convertDocumentFromUrl,
  SUPPORTED_FORMATS,
  OutputFormat,
} from "./document.service";

/**
 * POST /v1/document/convert
 *
 * Accepts JSON body:
 *   - `fileUrl` : cloud link of the document (e.g. Cloudinary URL) (required)
 *   - `format`  : target format, e.g. "pdf" or ".pdf" (required)
 *
 * Returns the converted file as a download.
 */
export const convert = catchAsync(async (req: Request, res: Response) => {
  const { fileUrl, format: rawFormat } = req.body;

  if (!fileUrl) {
    throw new AppiError("fileUrl is required in request body", 400, {
      fileUrl: "fileUrl is required",
    });
  }

  const format = (rawFormat || "").trim().toLowerCase() as string;

  if (!format) {
    throw new AppiError(
      `"format" field is required. Supported formats: ${SUPPORTED_FORMATS.join(
        ", ",
      )}`,
      400,
      { format: "format is required" },
    );
  }

  // Ensure format starts with a dot
  const outputFormat = (
    format.startsWith(".") ? format : `.${format}`
  ) as OutputFormat;

  if (!SUPPORTED_FORMATS.includes(outputFormat)) {
    throw new AppiError(
      `Unsupported format "${outputFormat}". Supported: ${SUPPORTED_FORMATS.join(
        ", ",
      )}`,
      400,
      { format: `Unsupported format: ${outputFormat}` },
    );
  }

  console.log(`Converting file from URL → ${outputFormat}`);
  console.log("  Source:", fileUrl);

  const { buffer: convertedBuffer, fileName } = await convertDocumentFromUrl(
    fileUrl,
    outputFormat,
  );

  // Map format to MIME type
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".txt": "text/plain",
    ".html": "text/html",
    ".rtf": "application/rtf",
    ".csv": "text/csv",
    ".png": "image/png",
    ".jpg": "image/jpeg",
  };

  const contentType = mimeTypes[outputFormat] || "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(convertedBuffer);
});

/**
 * GET /v1/document/formats
 *
 * Returns the list of supported output formats.
 */
export const getFormats = catchAsync(async (_req: Request, res: Response) => {
  res.json({ formats: SUPPORTED_FORMATS });
});
