import { listItems } from "@/db/planner";
import { YEAR } from "@/lib/calendar";

export const dynamic = "force-dynamic";

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

export async function GET() {
  try {
    const items = await listItems();
    const stamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Warm Planner//2027 Calendar//ZH-TW",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeIcs(`${YEAR} 行事曆`)}`,
      "X-WR-TIMEZONE:Asia/Taipei",
    ];

    for (const item of items) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:planner-${item.id}@warm-planner.local`);
      lines.push(`DTSTAMP:${stamp}`);
      if (item.allDay || !item.startTime) {
        lines.push(`DTSTART;VALUE=DATE:${icsDate(item.eventDate)}`);
        const next = new Date(`${item.eventDate}T00:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`);
      } else {
        const start = item.startTime.replace(":", "") + "00";
        const end = (item.endTime ?? item.startTime).replace(":", "") + "00";
        lines.push(`DTSTART;TZID=Asia/Taipei:${icsDate(item.eventDate)}T${start}`);
        lines.push(`DTEND;TZID=Asia/Taipei:${icsDate(item.eventDate)}T${end}`);
      }
      lines.push(`SUMMARY:${escapeIcs(item.title)}`);
      if (item.notes) lines.push(`DESCRIPTION:${escapeIcs(item.notes)}`);
      lines.push(`CATEGORIES:${escapeIcs(item.categorySlug)}`);
      lines.push(item.done ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="warm-planner-${YEAR}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/export failed", error);
    return Response.json({ error: "匯出失敗，請稍後再試" }, { status: 500 });
  }
}
