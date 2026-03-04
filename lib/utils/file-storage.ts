import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type StorageKind = 'uploads' | 'reports' | 'archives';

const LOCAL_PUBLIC_ROOT = path.join(process.cwd(), 'public');
const TMP_ROOT = path.join('/tmp', 'hdevents');

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getStorageDirectory(kind: StorageKind): string {
  if (process.env.VERCEL) {
    return path.join(TMP_ROOT, kind);
  }

  return path.join(LOCAL_PUBLIC_ROOT, kind);
}

export function toAbsolutePath(filePath: string): string {
  if (filePath.startsWith('/uploads/') || filePath.startsWith('/reports/') || filePath.startsWith('/archives/')) {
    return path.join(process.cwd(), 'public', filePath.slice(1));
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.join(process.cwd(), 'public', filePath);
}

export async function writeBinaryToStorage(params: {
  kind: StorageKind;
  originalFileName: string;
  buffer: Buffer;
}): Promise<{ absolutePath: string; dbPath: string; generatedFileName: string }> {
  const safeFileName = sanitizeFileName(params.originalFileName);
  const generatedFileName = `${Date.now()}-${randomUUID()}-${safeFileName}`;
  const storageDir = getStorageDirectory(params.kind);

  await mkdir(storageDir, { recursive: true });

  const absolutePath = path.join(storageDir, generatedFileName);
  await writeFile(absolutePath, params.buffer);

  // Local dev writes into /public for static access; serverless writes to /tmp.
  const dbPath = process.env.VERCEL
    ? absolutePath
    : path.posix.join('/', params.kind, generatedFileName);

  return { absolutePath, dbPath, generatedFileName };
}
