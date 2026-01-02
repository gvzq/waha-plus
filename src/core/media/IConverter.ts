import { AvailableInPlusVersion } from '../exceptions';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

const execAsync = promisify(exec);

export interface IMediaConverter {
  voice(content: Buffer): Promise<Buffer>;
  video(content: Buffer): Promise<Buffer>;
  optimizeImage(content: Buffer, options?: ImageOptimizationOptions): Promise<Buffer>;
  optimizeVideo(content: Buffer, options?: VideoOptimizationOptions): Promise<Buffer>;

  // Batch processing with retry logic
  processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<Buffer>,
    options?: BatchMediaProcessingOptions
  ): Promise<MediaProcessingResult<Buffer>[]>;

  // Retry wrapper for any media operation
  withRetry<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    args: T,
    options?: { attempts?: number; delay?: number; timeout?: number }
  ): Promise<R>;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface VideoOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  bitrate?: string;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow';
}

export interface BatchMediaProcessingOptions {
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface MediaProcessingResult<T = Buffer> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  duration: number;
}

export class CoreMediaConverter implements IMediaConverter {
  async video(content: Buffer): Promise<Buffer> {
    // Basic video conversion - attempt to convert to MP4 if ffmpeg is available
    try {
      const tempInput = this.createTempFile(content, 'input');
      const tempOutput = this.createTempFile(null, 'output.mp4');

      // Try ffmpeg conversion
      await execAsync(`ffmpeg -i "${tempInput}" -c:v libx264 -c:a aac -movflags +faststart "${tempOutput}" -y`);

      const convertedBuffer = fs.readFileSync(tempOutput);

      // Cleanup temp files
      this.cleanupTempFile(tempInput);
      this.cleanupTempFile(tempOutput);

      return convertedBuffer;
    } catch (error) {
      // If ffmpeg fails, return original buffer
      console.warn('Video conversion failed, returning original:', error.message);
      return content;
    }
  }

  async voice(content: Buffer): Promise<Buffer> {
    // Basic voice conversion - attempt to convert to OGG/Opus if ffmpeg is available
    try {
      const tempInput = this.createTempFile(content, 'input');
      const tempOutput = this.createTempFile(null, 'output.ogg');

      // Try ffmpeg conversion to OGG/Opus
      await execAsync(`ffmpeg -i "${tempInput}" -c:a libopus -b:a 64k "${tempOutput}" -y`);

      const convertedBuffer = fs.readFileSync(tempOutput);

      // Cleanup temp files
      this.cleanupTempFile(tempInput);
      this.cleanupTempFile(tempOutput);

      return convertedBuffer;
    } catch (error) {
      // If ffmpeg fails, return original buffer
      console.warn('Voice conversion failed, returning original:', error.message);
      return content;
    }
  }

  async optimizeImage(content: Buffer, options: ImageOptimizationOptions = {}): Promise<Buffer> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      let sharpInstance = sharp(content)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });

      // Apply format-specific options
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      console.warn('Image optimization failed, returning original:', error.message);
      return content;
    }
  }

  async optimizeVideo(content: Buffer, options: VideoOptimizationOptions = {}): Promise<Buffer> {
    const {
      maxWidth = 1280,
      maxHeight = 720,
      bitrate = '1M',
      preset = 'fast'
    } = options;

    try {
      const tempInput = this.createTempFile(content, 'input');
      const tempOutput = this.createTempFile(null, 'output.mp4');

      // Use ffmpeg for video optimization
      const ffmpegCommand = `ffmpeg -i "${tempInput}" -vf "scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease,pad=${maxWidth}:${maxHeight}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -b:v ${bitrate} -preset ${preset} -c:a aac -b:a 128k -movflags +faststart "${tempOutput}" -y`;

      await execAsync(ffmpegCommand);

      const optimizedBuffer = fs.readFileSync(tempOutput);

      // Cleanup temp files
      this.cleanupTempFile(tempInput);
      this.cleanupTempFile(tempOutput);

      return optimizedBuffer;
    } catch (error) {
      console.warn('Video optimization failed, returning original:', error.message);
      return content;
    }
  }

  async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<Buffer>,
    options: BatchMediaProcessingOptions = {}
  ): Promise<MediaProcessingResult<Buffer>[]> {
    const {
      concurrency = 3,
      retryAttempts = 2,
      retryDelay = 1000,
      timeout = 30000
    } = options;

    const results: MediaProcessingResult<Buffer>[] = [];
    const batches = this.chunkArray(items, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        const startTime = Date.now();

        try {
          const result = await this.withRetry(
            processor,
            [item],
            { attempts: retryAttempts, delay: retryDelay, timeout }
          );

          return {
            success: true,
            data: result,
            attempts: 1,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            attempts: retryAttempts,
            duration: Date.now() - startTime
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async withRetry<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    args: T,
    options: { attempts?: number; delay?: number; timeout?: number } = {}
  ): Promise<R> {
    const { attempts = 3, delay = 1000, timeout = 30000 } = options;
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });

        // Race between the operation and timeout
        const result = await Promise.race([
          operation(...args),
          timeoutPromise
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;

        if (i < attempts - 1) {
          console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms:`, error.message);
          await this.delay(delay * Math.pow(2, i)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createTempFile(content: Buffer | null, suffix: string): string {
    const tempDir = require('os').tmpdir();
    const fileName = `waha-convert-${crypto.randomBytes(8).toString('hex')}-${suffix}`;
    const filePath = path.join(tempDir, fileName);

    if (content) {
      fs.writeFileSync(filePath, content);
    }

    return filePath;
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temp file:', filePath, error.message);
    }
  }
}
