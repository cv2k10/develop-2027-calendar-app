import { deleteItem, parseItemInput, updateItem, type ItemInput } from "@/db/planner";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return Response.json({ error: "無效的行程編號" }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseItemInput(body, true);
    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const patch: Partial<ItemInput> = {};
    for (const key of Object.keys(body) as (keyof ItemInput)[]) {
      const value = parsed.value[key];
      if (value !== undefined) {
        (patch as Record<string, unknown>)[key] = value;
      }
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "沒有可更新的欄位" }, { status: 400 });
    }

    const item = await updateItem(numericId, patch);
    if (!item) {
      return Response.json({ error: "找不到這筆行程" }, { status: 404 });
    }
    return Response.json({ item });
  } catch (error) {
    console.error("PATCH /api/events/[id] failed", error);
    return Response.json({ error: "更新行程失敗，請稍後再試" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return Response.json({ error: "無效的行程編號" }, { status: 400 });
    }
    const removed = await deleteItem(numericId);
    if (!removed) {
      return Response.json({ error: "找不到這筆行程" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] failed", error);
    return Response.json({ error: "刪除行程失敗，請稍後再試" }, { status: 500 });
  }
}
