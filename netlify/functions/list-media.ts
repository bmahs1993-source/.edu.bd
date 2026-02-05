import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  try {
    const store = getStore({
      name: "school-media",
      consistency: "strong",
    });

    // List all blobs, optionally filtered by prefix (category)
    const listOptions = category ? { prefix: `${category}/` } : {};
    const { blobs } = await store.list(listOptions);

    // Get metadata for each blob
    const mediaList = await Promise.all(
      blobs.map(async (blob) => {
        const metadata = await store.getMetadata(blob.key);
        return {
          key: blob.key,
          etag: blob.etag,
          ...metadata?.metadata,
        };
      })
    );

    return new Response(JSON.stringify({ media: mediaList }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("List media error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list media", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
