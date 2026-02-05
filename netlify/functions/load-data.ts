import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

export default async (request: Request, context: Context) => {
  try {
    const store = getStore({
      name: "school-data",
      consistency: "strong",
    });

    // Load the school data
    const data = await store.get("school-config", { type: "json" });

    if (!data) {
      return new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Load data error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load data", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
