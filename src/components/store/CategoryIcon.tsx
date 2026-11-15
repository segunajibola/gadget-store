import { BatteryCharging, Headphones, Laptop, Printer, Router, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/constants";

const ICONS: Record<Category, LucideIcon> = {
  laptops: Laptop,
  accessories: Headphones,
  networking: Router,
  power_ups: BatteryCharging,
  office_it: Printer,
};

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = ICONS[category];
  return <Icon className={className} aria-hidden="true" />;
}
