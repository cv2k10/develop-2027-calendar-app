import { CalendarApp } from "@/components/CalendarApp";
import { listCategories, listItems } from "@/db/planner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [items, categories] = await Promise.all([listItems(), listCategories()]);

  return <CalendarApp initialItems={items} categories={categories} />;
}
