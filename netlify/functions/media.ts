import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  // Get the key from the URL path
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "No key provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const store = getStore({
      name: "school-media",
      consistency: "strong",
    });

    // Get the file with metadata
    const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

    if (!result) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, metadata } = result;
    const contentType = (metadata?.contentType as string) || "application/octet-stream";
    const fileName = (metadata?.fileName as string) || "download";

    return new Response(data as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Media retrieval error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve file", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
