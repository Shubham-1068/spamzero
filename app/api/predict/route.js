export const runtime = "nodejs";

export async function POST(req) {
  try {
    const huggingFaceUri = process.env.HUGGING_FACE_URI;

    if (!huggingFaceUri) {
      return Response.json(
        { error: "Missing HUGGINGFACE_PREDICT_URL in environment" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const textInput =
      typeof body.message === "string"
        ? body.message
        : typeof body.text === "string"
        ? body.text
        : typeof body.inputs === "string"
        ? body.inputs
        : "";

    const payload = textInput.trim().length > 0 ? { message: textInput } : body;

    const headers = {
      "Content-Type": "application/json",
    };

    const hfResponse = await fetch(huggingFaceUri, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const contentType = hfResponse.headers.get("content-type") || "";
    const responseData = contentType.includes("application/json")
      ? await hfResponse.json()
      : await hfResponse.text();

    if (!hfResponse.ok) {
      return Response.json(
        {
          error: "Hugging Face prediction request failed",
          status: hfResponse.status,
          details: responseData,
        },
        { status: hfResponse.status }
      );
    }

    return Response.json({ ok: true, result: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch prediction",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
