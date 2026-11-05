import type { SVGProps } from "react";
import { resolveIcon, type IconName, type IconVariant } from "./registry";
import styles from "./icon.module.css";

type AccessibleIcon = { decorative?: true; label?: never } | { decorative: false; label: string };
export type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "color" | "children" | "role" | "aria-label" | "aria-hidden"> & AccessibleIcon & {
  name: IconName | (string & {});
  size?: number | string;
  color?: string;
  variant?: IconVariant;
  state?: "default" | "active" | "inactive" | "error" | "success";
};

export function Icon({ name, size = 20, color, variant = "default", state = "default", decorative = true, label, className = "", style, ...props }: IconProps) {
  const { component: Glyph, provider } = resolveIcon(name, variant);
  // A missing runtime label must never expose an unnamed image to assistive technology.
  const meaningful = !decorative && Boolean(label?.trim());
  return <Glyph {...props} width={size} height={size} className={`${styles.icon} ${className}`}
    data-icon={name} data-provider={provider} data-state={state} data-variant={variant}
    color={color} style={{ ...style, ...(color ? { color } : {}) }} focusable="false"
    role={meaningful ? "img" : undefined} aria-hidden={meaningful ? undefined : true} aria-label={meaningful ? label : undefined} />;
}
