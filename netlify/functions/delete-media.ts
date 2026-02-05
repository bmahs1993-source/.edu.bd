import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  // Only allow DELETE requests
  if (request.method !== "DELETE" && request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const key = body.key;

    if (!key) {
      return new Response(JSON.stringify({ error: "No key provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = getStore({
      name: "school-media",
      consistency: "strong",
    });

    await store.delete(key);

    return new Response(JSON.stringify({ success: true, key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete file", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
