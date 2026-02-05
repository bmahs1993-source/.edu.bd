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
    const data = await request.json();

    const store = getStore({
      name: "school-data",
      consistency: "strong",
    });

    // Save the school data as JSON
    await store.setJSON("school-config", data, {
      metadata: {
        updatedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Data saved successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Save data error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save data", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
