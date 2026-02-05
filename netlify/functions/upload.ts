import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string || "general";
    const customKey = formData.get("key") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate a unique key for the file
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = customKey || `${category}/${timestamp}-${sanitizedFileName}`;

    // Get the appropriate store based on environment
    const store = getStore({
      name: "school-media",
      consistency: "strong",
    });

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Store the file with metadata
    await store.set(key, arrayBuffer, {
      metadata: {
        contentType: file.type,
        fileName: file.name,
        fileSize: file.size,
        category: category,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Return the key that can be used to retrieve the file
    return new Response(
      JSON.stringify({
        success: true,
        key: key,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upload file", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
