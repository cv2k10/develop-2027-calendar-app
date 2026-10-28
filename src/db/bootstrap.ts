import { sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, events } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "@/lib/calendar";

type SeedItem = {
  title: string;
  notes: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  kind: "event" | "task";
  done: boolean;
  categorySlug: string;
};

const SEED_ITEMS: SeedItem[] = [
  // January
  { title: "元旦假期", notes: "新的一年，先把節奏放慢。", eventDate: "2027-01-01", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "年度目標規劃", notes: "寫下三個關鍵字、五件一定要完成的事。", eventDate: "2027-01-04", startTime: "09:30", endTime: "11:00", allDay: false, kind: "task", done: false, categorySlug: "personal" },
  { title: "第一季專案啟動會議", notes: "確認里程碑與負責人名單。", eventDate: "2027-01-08", startTime: "10:00", endTime: "12:00", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "年度健康檢查", notes: "空腹八小時，記得帶健保卡。", eventDate: "2027-01-15", startTime: "08:30", endTime: null, allDay: false, kind: "event", done: false, categorySlug: "health" },
  { title: "季報截止", notes: "彙整 2026 第四季數字與消費者洞察。", eventDate: "2027-01-22", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "work" },
  { title: "提案簡報", notes: "客戶總部 12 樓，提早 30 分鐘到場。", eventDate: "2027-01-27", startTime: "14:00", endTime: "15:30", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "一月閱讀清單", notes: "《一流的人如何保持顛峰》讀完一半。", eventDate: "2027-01-30", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "study" },

  // February
  { title: "尾牙晚宴", notes: "訂位 18:30，記得帶相機。", eventDate: "2027-02-05", startTime: "18:30", endTime: "21:00", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "農曆新年", notes: "返鄉過年，陪伴家人。", eventDate: "2027-02-06", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "開工日", notes: "準備開工紅包與新年新目標。", eventDate: "2027-02-11", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "春季小旅行", notes: "台南三天兩夜，訂房完成。", eventDate: "2027-02-19", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "personal" },
  { title: "二月財務對帳", notes: "整理發票與訂閱制支出。", eventDate: "2027-02-26", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "personal" },

  // March
  { title: "產品改版上線", notes: "上线前完成三輪測試與客服教育訓練。", eventDate: "2027-03-05", startTime: "11:00", endTime: "11:30", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "跑步訓練 5K", notes: "河堤夜跑，維持每週三次。", eventDate: "2027-03-10", startTime: "19:00", endTime: "20:00", allDay: false, kind: "event", done: false, categorySlug: "health" },
  { title: "春季講座：時間管理", notes: "線上報名，講者為生產力顧問。", eventDate: "2027-03-18", startTime: "19:30", endTime: "21:00", allDay: false, kind: "event", done: false, categorySlug: "study" },
  { title: "第一季回顧", notes: "檢視目標達成率，調整第二季計畫。", eventDate: "2027-03-31", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "personal" },

  // April
  { title: "兒童節連假", notes: "帶孩子去動物園。", eventDate: "2027-04-04", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "清明節家族掃墓", notes: "早上七點集合，準備鮮花素果。", eventDate: "2027-04-05", startTime: "07:00", endTime: null, allDay: false, kind: "event", done: false, categorySlug: "holiday" },
  { title: "報稅資料整理", notes: "下載所得清單與捐贈收據。", eventDate: "2027-04-20", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "work" },
  { title: "春季攝影散步", notes: "下午四點的光線最美。", eventDate: "2027-04-24", startTime: "16:00", endTime: "18:00", allDay: false, kind: "event", done: false, categorySlug: "personal" },

  // May
  { title: "勞動節", notes: "好好休息一天。", eventDate: "2027-05-01", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "母親節聚餐", notes: "訂了 12:00 的桌，記得提早出門。", eventDate: "2027-05-09", startTime: "12:00", endTime: "14:30", allDay: false, kind: "event", done: false, categorySlug: "holiday" },
  { title: "半年度績效面談", notes: "準備成果清單與下一階段目標。", eventDate: "2027-05-20", startTime: "15:00", endTime: "16:00", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "新技能課程開課", notes: "十二週的資料分析課程，每週二晚上。", eventDate: "2027-05-25", startTime: "19:00", endTime: "21:30", allDay: false, kind: "event", done: false, categorySlug: "study" },

  // June
  { title: "端午節", notes: "立蛋、吃粽子。", eventDate: "2027-06-09", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "季度成果報告", notes: "整理數據圖表與下季提案。", eventDate: "2027-06-18", startTime: "10:00", endTime: "11:30", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "夏日音樂祭", notes: "與老朋友一起，記得帶野餐墊。", eventDate: "2027-06-26", startTime: "16:00", endTime: "22:00", allDay: false, kind: "event", done: false, categorySlug: "personal" },

  // July
  { title: "下半年啟動會議", notes: "重新排序優先順序。", eventDate: "2027-07-01", startTime: "09:00", endTime: "10:30", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "家族海島旅行", notes: "五天四夜，行李清單已建立。", eventDate: "2027-07-15", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "personal" },
  { title: "健康檢查回診", notes: "看報告，詢問運動建議。", eventDate: "2027-07-23", startTime: "09:00", endTime: null, allDay: false, kind: "event", done: false, categorySlug: "health" },
  { title: "下半年閱讀清單", notes: "選三本，寫下為什麼想讀。", eventDate: "2027-07-31", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "study" },

  // August
  { title: "父親節晚餐", notes: "訂爸爸最愛的老字號餐廳。", eventDate: "2027-08-08", startTime: "18:30", endTime: "20:30", allDay: false, kind: "event", done: false, categorySlug: "holiday" },
  { title: "新產品市場研究", notes: "完成 15 份使用者訪談。", eventDate: "2027-08-17", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "work" },
  { title: "週末露營", notes: "新竹山區，記得帶防蚊液。", eventDate: "2027-08-21", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "personal" },

  // September
  { title: "中秋節烤肉", notes: "頂樓烤肉，邀約名單十人。", eventDate: "2027-09-15", startTime: "18:00", endTime: "22:00", allDay: false, kind: "event", done: false, categorySlug: "holiday" },
  { title: "教師節謝師餐會", notes: "準備感謝卡片。", eventDate: "2027-09-28", startTime: "18:30", endTime: null, allDay: false, kind: "event", done: false, categorySlug: "study" },
  { title: "第三季回顧", notes: "整理完成事項與未完成原因。", eventDate: "2027-09-30", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "work" },

  // October
  { title: "國慶日", notes: "連假，安排一趟短程旅行。", eventDate: "2027-10-10", startTime: null, endTime: null, allDay: true, kind: "event", done: false, categorySlug: "holiday" },
  { title: "年度品牌發表會", notes: "場地佈置 13:00 進場，彩排 15:00。", eventDate: "2027-10-22", startTime: "19:00", endTime: "21:30", allDay: false, kind: "event", done: false, categorySlug: "work" },
  { title: "健檢與體態追蹤", notes: "記錄體脂與睡眠時數。", eventDate: "2027-10-28", startTime: "08:00", endTime: null, allDay: false, kind: "event", done: false, categorySlug: "health" },

  // November
  { title: "感恩節聚餐", notes: "和朋友一起煮一桌菜。", eventDate: "2027-11-25", startTime: "19:00", endTime: "22:00", allDay: false, kind: "event", done: false, categorySlug: "personal" },
  { title: "年度預算編列", notes: "盤點今年支出，規劃明年預算。", eventDate: "2027-11-30", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "work" },

  // December
  { title: "聖誕交換禮物", notes: "預算 500 元，包裝走溫暖風。", eventDate: "2027-12-25", startTime: "18:00", endTime: "21:00", allDay: false, kind: "event", done: false, categorySlug: "holiday" },
  { title: "年度回顧與感謝", notes: "寫一封信給明年的自己。", eventDate: "2027-12-30", startTime: null, endTime: null, allDay: true, kind: "task", done: false, categorySlug: "personal" },
  { title: "跨年計畫", notes: "找一個看得到煙火的地方。", eventDate: "2027-12-31", startTime: "20:00", endTime: "23:59", allDay: false, kind: "event", done: false, categorySlug: "holiday" },
];

const globalForBootstrap = globalThis as typeof globalThis & {
  __plannerBootstrap?: Promise<void>;
};

async function bootstrap(): Promise<void> {
  await db.execute(sql`
    create table if not exists categories (
      id serial primary key,
      slug text not null,
      name text not null,
      color text not null,
      sort_order integer not null default 0
    )
  `);
  await db.execute(sql`create unique index if not exists categories_slug_key on categories (slug)`);

  await db.execute(sql`
    create table if not exists events (
      id serial primary key,
      title text not null,
      notes text not null default '',
      event_date date not null,
      start_time text,
      end_time text,
      all_day boolean not null default true,
      kind text not null default 'event',
      done boolean not null default false,
      category_slug text not null default 'personal',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`create index if not exists events_event_date_idx on events (event_date)`);

  for (const category of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        slug: category.slug,
        name: category.name,
        color: category.color,
        sortOrder: category.sortOrder ?? 0,
      })
      .onConflictDoNothing({ target: categories.slug });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events);

  if (Number(count) === 0) {
    await db.insert(events).values(SEED_ITEMS);
  }
}

export function ensureDatabase(): Promise<void> {
  if (!globalForBootstrap.__plannerBootstrap) {
    globalForBootstrap.__plannerBootstrap = bootstrap().catch((error: unknown) => {
      globalForBootstrap.__plannerBootstrap = undefined;
      throw error;
    });
  }
  return globalForBootstrap.__plannerBootstrap;
}
