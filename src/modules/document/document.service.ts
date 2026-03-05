import path from "path";

const libre = require("libreoffice-convert");

/**
 * Wraps libre.convert in a promise.
 * Avoids the DEP0174 deprecation warning from promisify on a
 * function that already returns a Promise in newer versions.
 */
function convertAsync(
  input: Buffer,
  format: string,
  filter: undefined,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    libre.convert(
      input,
      format,
      filter,
      (err: Error | null, result: Buffer) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
  });
}

/** Supported output formats */
export const SUPPORTED_FORMATS = [
  ".pdf",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".odt",
  ".ods",
  ".odp",
  ".txt",
  ".html",
  ".rtf",
  ".csv",
  ".png",
  ".jpg",
] as const;

export type OutputFormat = typeof SUPPORTED_FORMATS[number];

/**
 * Fetch a file from a cloud URL and return its buffer + derived filename.
 */
async function fetchFileFromUrl(
  fileUrl: string,
): Promise<{ buffer: Buffer; originalName: string }> {
  const res = await fetch(fileUrl);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch file from URL (${res.status} ${res.statusText}): ${fileUrl}`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Try to derive a filename from the URL path
  const urlPath = new URL(fileUrl).pathname;
  const originalName = path.basename(urlPath) || "document";

  return { buffer, originalName };
}

/**
 * Fetch a document from a cloud URL and convert it to the requested format
 * using LibreOffice.
 *
 * @param fileUrl      - Cloud link to the document (e.g. Cloudinary URL)
 * @param outputFormat - Target extension, e.g. ".pdf"
 * @returns The converted file buffer and a suggested download filename
 */
export async function convertDocumentFromUrl(
  fileUrl: string,
  outputFormat: OutputFormat,
): Promise<{ buffer: Buffer; fileName: string }> {
  if (!SUPPORTED_FORMATS.includes(outputFormat)) {
    throw new Error(
      `Unsupported output format "${outputFormat}". Supported: ${SUPPORTED_FORMATS.join(
        ", ",
      )}`,
    );
  }

  const { buffer: inputBuffer, originalName } = await fetchFileFromUrl(fileUrl);

  console.log(
    `  Fetched "${originalName}" (${(inputBuffer.length / 1024).toFixed(
      1,
    )} KB)`,
  );

  const convertedBuffer: Buffer = await convertAsync(
    inputBuffer,
    outputFormat,
    undefined,
  );

  // Derive download filename: replace original extension with target
  const baseName = originalName.replace(/\.[^.]+$/, "");
  const fileName = `${baseName}${outputFormat}`;

  return { buffer: convertedBuffer, fileName };
}
