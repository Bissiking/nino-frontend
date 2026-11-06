export const viewerNavigation = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/videos", label: "Vidéos", icon: "video" },
  { href: "/series", label: "Séries", icon: "library" },
  { href: "/flashy", label: "Flashy", icon: "flashy" },
  { href: "/search", label: "Recherche", icon: "search" }
];

export const studioNavigation = [
  { label: "Piloter", items: [
    { href: "/studio/overview", label: "Tableau", icon: "dashboard" },
    { href: "/studio/schedule", label: "Programmation", icon: "calendar" }
  ] },
  { label: "Bibliothèque", items: [
    { href: "/studio/videos", label: "Vidéos", icon: "video" },
    { href: "/studio/series", label: "Séries", icon: "library" },
    { href: "/studio/flashy", label: "Flashy", icon: "flashy" }
  ] },
  { label: "Exploitation", items: [
    { href: "/studio/transcode", label: "Transcodage", icon: "activity" },
    { href: "/studio/administration", label: "Système", icon: "settings" },
    { href: "/studio/live", label: "Direct · DEV", icon: "live" }
  ] }
];

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
