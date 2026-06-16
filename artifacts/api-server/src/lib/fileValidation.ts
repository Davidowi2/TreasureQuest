
import fs from "fs/promises";

// Magic bytes for common image formats
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  jpeg: [new Uint8Array([0xff, 0xd8, 0xff])],
  png: [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  gif: [
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])  // GIF89a
  ],
  webp: [new Uint8Array([0x52, 0x49, 0x46, 0x46])] // RIFF header, followed by WEBP
};

/**
 * Validates that a file is an image by checking its magic bytes
 * @param filePath - Path to the file to validate
 * @param allowedTypes - Array of allowed image types (jpeg, png, gif, webp)
 * @returns Promise<boolean> - true if file is a valid image of allowed types
 */
export async function validateImageFile(filePath: string, allowedTypes: string[] = ["jpeg", "png"]): Promise<boolean> {
  try {
    const fileHandle = await fs.open(filePath, "r");
    const buffer = new Uint8Array(8);
    await fileHandle.read(buffer, 0, 8, 0);
    await fileHandle.close();

    for (const type of allowedTypes) {
      const signatures = MAGIC_BYTES[type];
      if (!signatures) continue;

      for (const signature of signatures) {
        let match = true;
        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          if (type === "webp") {
            // For WebP, verify the "WEBP" part after RIFF header
            const webpHeader = new Uint8Array([0x57, 0x45, 0x42, 0x50]);
            for (let i = 0; i < webpHeader.length; i++) {
              if (buffer[8 + i] !== webpHeader[i]) { // Wait, we only read first 8 bytes, adjust
                const fullBuffer = new Uint8Array(12);
                const fh = await fs.open(filePath, "r");
                await fh.read(fullBuffer, 0, 12, 0);
                await fh.close();
                for (let j = 0; j < webpHeader.length; j++) {
                  if (fullBuffer[8 + j] !== webpHeader[j]) {
                    match = false;
                    break;
                  }
                }
              }
            }
          }
          if (match) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (err) {
    console.error("Error validating file:", err);
    return false;
  }
}
