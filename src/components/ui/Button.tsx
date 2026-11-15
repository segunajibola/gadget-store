/**
 * The ONE button style for the whole app (storefront + admin).
 *
 *   <Button>Save</Button>                          primary (default)
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="danger">Delete</Button>
 *   <ButtonLink href="/shop">Shop now</ButtonLink>  same look, renders a <Link>
 *   buttonClasses("secondary")                      for other elements (e.g. a <label>)
 *
 * Works in Server and Client Components (no hooks).
 */
import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 aria-disabled:bg-brand-300",
  secondary:
    "border border-brand-600 bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100 disabled:border-brand-300 disabled:text-brand-300",
  danger:
    "bg-danger text-white hover:bg-danger-700 disabled:opacity-50",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant, size, className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
