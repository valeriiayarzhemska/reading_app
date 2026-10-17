import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

import type { CoverUpload } from '@reading/shared';

import { apiFetch } from './client';

// 1. Our API checks who we are and signs a one-time link for this exact size
// 2. The file goes straight to R2 with that link, not through our API
// Returns the public URL to save as the book's coverUrl.
export async function uploadCover(localUri: string): Promise<string> {
  const file = new File(localUri);

  const { uploadUrl, publicUrl } = await apiFetch<CoverUpload>(
    '/uploads/cover',
    { method: 'POST', body: JSON.stringify({ size: file.size }) },
  );

  // No Authorization header: the signature in the URL is the permission
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Cover upload failed (${res.status})`);
  }

  return publicUrl;
}
