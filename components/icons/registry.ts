import type { ComponentType, SVGProps } from "react";
import {
  Activity, CalendarDays, LogOut, PanelsTopLeft, Radio, Settings, UsersRound, Menu as MenuIcon, AlertTriangle, Bell, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Film, Heart, Home, Info, LibraryBig, Loader2, Lock, Pause, Play,
  Plus, RotateCw, Save, Search, ShieldCheck, Trash2, UserRound, WifiOff, X, Zap
} from "lucide-react";
import {
  PapAlertTriangle, PapBell, PapCheck, PapChevronDown, PapChevronLeft, PapChevronRight,
  PapCross, PapHeart, PapHome, PapInfo, PapLock, PapPause, PapPlay, PapPlus, PapSearch,
  PapTrash, PapUser
} from "./vendor/papicons";

// Only explicitly selected icons enter this registry. Never import a provider namespace.
// Papicons is the default when its meaning matches; outline alternatives preserve V8 uses.
export const iconRegistry = {
  home: { default: PapHome, solid: PapHome, outline: Home, outlineProvider: "lucide", provider: "papicons" },
  search: { default: PapSearch, solid: PapSearch, outline: Search, outlineProvider: "lucide", provider: "papicons" },
  play: { default: PapPlay, solid: PapPlay, outline: Play, outlineProvider: "lucide", provider: "papicons" },
  pause: { default: PapPause, solid: PapPause, outline: Pause, outlineProvider: "lucide", provider: "papicons" },
  "chevron-left": { default: PapChevronLeft, solid: PapChevronLeft, outline: ChevronLeft, outlineProvider: "lucide", provider: "papicons" },
  "chevron-right": { default: PapChevronRight, solid: PapChevronRight, outline: ChevronRight, outlineProvider: "lucide", provider: "papicons" },
  "chevron-down": { default: PapChevronDown, solid: PapChevronDown, outline: ChevronDown, outlineProvider: "lucide", provider: "papicons" },
  close: { default: PapCross, solid: PapCross, outline: X, outlineProvider: "lucide", provider: "papicons" },
  check: { default: PapCheck, solid: PapCheck, outline: Check, outlineProvider: "lucide", provider: "papicons" },
  heart: { default: PapHeart, solid: PapHeart, outline: Heart, outlineProvider: "lucide", provider: "papicons" },
  notification: { default: PapBell, solid: PapBell, outline: Bell, outlineProvider: "lucide", provider: "papicons" },
  user: { default: PapUser, solid: PapUser, outline: UserRound, outlineProvider: "lucide", provider: "papicons" },
  lock: { default: PapLock, solid: PapLock, outline: Lock, outlineProvider: "lucide", provider: "papicons" },
  trash: { default: PapTrash, solid: PapTrash, outline: Trash2, outlineProvider: "lucide", provider: "papicons" },
  plus: { default: PapPlus, solid: PapPlus, outline: Plus, outlineProvider: "lucide", provider: "papicons" },
  info: { default: PapInfo, solid: PapInfo, outline: Info, outlineProvider: "lucide", provider: "papicons" },
  warning: { default: PapAlertTriangle, solid: PapAlertTriangle, outline: AlertTriangle, outlineProvider: "lucide", provider: "papicons" },
  success: { default: CheckCircle2, provider: "lucide" },
  loader: { default: Loader2, provider: "lucide" },
  save: { default: Save, provider: "lucide" },
  retry: { default: RotateCw, provider: "lucide" },
  offline: { default: WifiOff, provider: "lucide" },
  "shield-check": { default: ShieldCheck, provider: "lucide" },
  video: { default: Film, provider: "lucide" },
  library: { default: LibraryBig, provider: "lucide" },
  flashy: { default: Zap, provider: "lucide" },
  dashboard: { default: PanelsTopLeft, provider: "lucide" },
  calendar: { default: CalendarDays, provider: "lucide" },
  activity: { default: Activity, provider: "lucide" },
  settings: { default: Settings, provider: "lucide" },
  live: { default: Radio, provider: "lucide" },
  users: { default: UsersRound, provider: "lucide" },
  logout: { default: LogOut, provider: "lucide" },
  menu: { default: MenuIcon, provider: "lucide" },
  unknown: { default: CircleHelp, provider: "lucide" }
} as const;

export type IconName = keyof typeof iconRegistry;
export type IconVariant = "default" | "outline" | "solid";

type IconDefinition = { default: ComponentType<SVGProps<SVGSVGElement>>; outline?: ComponentType<SVGProps<SVGSVGElement>>; outlineProvider?: string; solid?: ComponentType<SVGProps<SVGSVGElement>>; provider: string };

export function resolveIcon(name: string, variant: IconVariant = "default") {
  const definition: IconDefinition = Object.hasOwn(iconRegistry, name) ? iconRegistry[name as IconName] : iconRegistry.unknown;
  return { component: definition[variant] ?? definition.default, provider: variant === "outline" && definition.outline ? definition.outlineProvider ?? definition.provider : definition.provider };
}
