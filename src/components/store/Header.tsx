import Link from "next/link";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { LogoMark } from "@/components/ui/Logo";
import { inputCls } from "@/components/ui/styles";
import { CartButton } from "./CartButton";

function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  // Plain GET form → /products?q=… (works without JavaScript)
  return (
    <form action="/products" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search laptops, chargers, routers…"
        className={`${inputCls} pl-9`}
      />
    </form>
  );
}

export function Header({ storeName }: { storeName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900">
          {/* priority: the logo is visible immediately on every page */}
          <LogoMark size={36} priority />
          <span className="text-lg">{storeName}</span>
        </Link>
        <SearchForm id="search-desktop" className="hidden flex-1 md:block md:max-w-md" />
        <div className="ml-auto">
          <CartButton />
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <SearchForm id="search-mobile" />
      </div>

      {/* Category nav — scrolls sideways on phones */}
      <nav aria-label="Categories" className="border-t border-slate-100">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1 text-sm">
          <li>
            <Link href="/products" className="block whitespace-nowrap rounded px-3 py-1.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700">
              All products
            </Link>
          </li>
          {Object.entries(CATEGORIES).map(([value, label]) => (
            <li key={value}>
              <Link
                href={`/products?category=${value}`}
                className="block whitespace-nowrap rounded px-3 py-1.5 text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link
              href="/laptop-finder"
              className="block whitespace-nowrap rounded px-3 py-1.5 font-medium text-brand-700 hover:bg-brand-50"
            >
              ✨ Help me choose a laptop
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
