import { unlink, readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db/prisma';
import { toAbsolutePath, writeBinaryToStorage } from '@/lib/utils/file-storage';

export async function saveItemDocuments(params: { itemId: string; files: File[] }): Promise<void> {
  const validFiles = params.files.filter((file) => file.size > 0);

  if (validFiles.length === 0) {
    return;
  }

  for (const file of validFiles) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storedFile = await writeBinaryToStorage({
      kind: 'uploads',
      originalFileName: file.name,
      buffer
    });

    await prisma.document.create({
      data: {
        itemId: params.itemId,
        fileName: file.name,
        filePath: storedFile.dbPath
      }
    });
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  const existingDocument = await prisma.document.findUnique({ where: { id: documentId } });

  if (!existingDocument) {
    throw new Error('Document not found');
  }

  await prisma.document.delete({ where: { id: documentId } });

  const fileAbsolutePath = resolveFileAbsolutePath(existingDocument.filePath);

  try {
    await unlink(fileAbsolutePath);
  } catch {
    // File may have been already removed or not persisted in ephemeral runtimes.
  }
}

export async function getDocumentById(documentId: string) {
  return prisma.document.findUnique({ where: { id: documentId } });
}

export async function readDocumentBuffer(documentId: string): Promise<{ buffer: Buffer; fileName: string }> {
  const document = await prisma.document.findUnique({ where: { id: documentId } });

  if (!document) {
    throw new Error('Document not found');
  }

  const absolutePath = resolveFileAbsolutePath(document.filePath);
  const buffer = await readFile(absolutePath);

  return {
    buffer,
    fileName: document.fileName
  };
}

export function resolveFileAbsolutePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return toAbsolutePath(filePath);
}
