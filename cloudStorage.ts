// Cloud storage utilities for interacting with Netlify Blobs

export interface UploadResult {
  success: boolean;
  key?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  error?: string;
}

export interface MediaItem {
  key: string;
  etag: string;
  contentType?: string;
  fileName?: string;
  fileSize?: number;
  category?: string;
  uploadedAt?: string;
}

// Upload a file to cloud storage
export async function uploadToCloud(
  file: File,
  category: string = "general",
  customKey?: string
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (customKey) {
      formData.append("key", customKey);
    }

    const response = await fetch("/.netlify/functions/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Upload failed" };
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: String(error) };
  }
}

// Get the URL to access a file from cloud storage
export function getCloudMediaUrl(key: string): string {
  return `/.netlify/functions/media?key=${encodeURIComponent(key)}`;
}

// List all media files, optionally filtered by category
export async function listCloudMedia(category?: string): Promise<MediaItem[]> {
  try {
    const url = category
      ? `/.netlify/functions/list-media?category=${encodeURIComponent(category)}`
      : "/.netlify/functions/list-media";

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to list media");
      return [];
    }

    const data = await response.json();
    return data.media || [];
  } catch (error) {
    console.error("List media error:", error);
    return [];
  }
}

// Delete a file from cloud storage
export async function deleteFromCloud(key: string): Promise<boolean> {
  try {
    const response = await fetch("/.netlify/functions/delete-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    return response.ok;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

// Save school data to cloud storage
export async function saveDataToCloud(data: any): Promise<boolean> {
  try {
    const response = await fetch("/.netlify/functions/save-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.ok;
  } catch (error) {
    console.error("Save data error:", error);
    return false;
  }
}

// Load school data from cloud storage
export async function loadDataFromCloud(): Promise<any | null> {
  try {
    const response = await fetch("/.netlify/functions/load-data");

    if (!response.ok) {
      console.error("Failed to load data from cloud");
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Load data error:", error);
    return null;
  }
}

// Helper to check if a URL is a cloud storage key (vs base64 or external URL)
export function isCloudStorageKey(url: string): boolean {
  return url.startsWith("gallery/") ||
         url.startsWith("logos/") ||
         url.startsWith("faculty/") ||
         url.startsWith("pdfs/") ||
         url.startsWith("banners/") ||
         url.startsWith("profiles/") ||
         url.startsWith("general/");
}

// Get the display URL - handles both cloud keys and regular URLs
export function getDisplayUrl(urlOrKey: string): string {
  if (!urlOrKey) return "";

  // If it's a cloud storage key, convert to media URL
  if (isCloudStorageKey(urlOrKey)) {
    return getCloudMediaUrl(urlOrKey);
  }

  // Otherwise return as-is (could be base64 or external URL)
  return urlOrKey;
}
