import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const historyCollection = (await getDb()).collection("history");
    const result = await historyCollection.insertOne({
      ...body,
      createdAt: new Date(),
    });

    return Response.json(
      {
        message: "History saved",
        id: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to save history",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await (await getDb())
      .collection("history")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const data = records.map((item) => ({
      ...item,
      _id: item._id.toString(),
    }));

    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch history",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("all") === "true";
    const historyCollection = (await getDb()).collection("history");

    if (clearAll) {
      const result = await historyCollection.deleteMany({});
      return Response.json(
        {
          message: "All history deleted",
          deletedCount: result.deletedCount,
        },
        { status: 200 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Provide a valid JSON body with id, or use ?all=true" },
        { status: 400 }
      );
    }

    const id = body?.id;

    if (typeof id !== "string" || !id.trim()) {
      return Response.json(
        { error: "Missing history id" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid history id" }, { status: 400 });
    }

    const result = await historyCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ error: "History item not found" }, { status: 404 });
    }

    return Response.json(
      {
        message: "History item deleted",
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to delete history",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
