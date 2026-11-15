import Image from "next/image";

/**
 * The logo mark (box + smile), cropped from public/images/logo.jpg.
 * - variant "color": blue mark for light backgrounds
 * - variant "white": white mark for dark backgrounds (hero/footer)
 * Decorative by default (alt="") because the store name is shown next to it.
 */
export function LogoMark({
  size = 32,
  variant = "color",
  alt = "",
  priority,
}: {
  size?: number;
  variant?: "color" | "white";
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "white" ? "/images/logo-mark-white.png" : "/images/logo-mark.png"}
      width={size}
      height={size}
      alt={alt}
      priority={priority}
      className="shrink-0"
    />
  );
}
