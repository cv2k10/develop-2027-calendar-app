import { createItem, listItems, parseItemInput } from "@/db/planner";
import { matchesQuery } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const month = url.searchParams.get("month");
    let items = await listItems();

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      items = items.filter((item) => item.eventDate.startsWith(month));
    }
    if (q) {
      items = items.filter((item) => matchesQuery(item, q));
    }

    return Response.json({ items });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return Response.json({ error: "無法載入行程，請稍後再試" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseItemInput(body);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const item = await createItem(parsed.value);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed", error);
    return Response.json({ error: "新增行程失敗，請稍後再試" }, { status: 500 });
  }
}
