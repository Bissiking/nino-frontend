"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, CircleAlert, Inbox, Loader2, RefreshCw, X } from "lucide-react";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types/nino";

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function StudioNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.notifications());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node) || triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", keydown);
    };
  }, [open]);

  async function markRead(item: NotificationItem) {
    if (item.is_read) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
    try {
      await api.markNotificationRead(item.id);
    } catch (reason) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: false } : entry));
      setError(reason instanceof Error ? reason.message : "La notification n’a pas pu être marquée comme lue.");
    }
  }

  async function markAllRead() {
    setActing(true);
    setError(null);
    try {
      await api.markAllNotificationsRead();
      setItems((current) => current.map((entry) => ({ ...entry, is_read: true })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Les notifications n’ont pas pu être mises à jour.");
    } finally {
      setActing(false);
    }
  }

  const unread = items.filter((item) => !item.is_read).length;

  return (
    <div className="studioNotifications">
      <button ref={triggerRef} className="studioNotification" type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? ` — ${unread} non lue${unread > 1 ? "s" : ""}` : " — aucune non lue"}`} aria-haspopup="dialog" aria-expanded={open}>
        <Bell size={20} aria-hidden="true" />
        {unread ? <span aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
      </button>

      {open ? (
        <div ref={panelRef} className="studioNotificationPanel" role="dialog" aria-modal="false" aria-labelledby="studio-notification-title">
          <header>
            <div><h2 id="studio-notification-title">Notifications</h2><p>{unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour"}</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer les notifications"><X size={18} /></button>
          </header>
          {unread ? <button className="studioMarkAllRead" type="button" onClick={() => void markAllRead()} disabled={acting}>{acting ? <Loader2 className="spin" size={15} /> : <CheckCheck size={15} />}Tout marquer comme lu</button> : null}
          {loading ? <div className="studioNotificationState" role="status"><Loader2 className="spin" size={20} />Chargement…</div> : null}
          {error && !loading ? <div className="studioNotificationState isError" role="alert"><CircleAlert size={20} /><span>{error}</span><button type="button" onClick={() => void load()}><RefreshCw size={15} />Réessayer</button></div> : null}
          {!loading && !error && !items.length ? <div className="studioNotificationState"><Inbox size={24} /><strong>Aucune notification</strong><span>Les alertes de publication et du système apparaîtront ici.</span></div> : null}
          {!loading && items.length ? <ul>{items.map((item) => <li key={item.id} className={`${item.is_read ? "isRead" : ""} is${item.level}`}><button type="button" onClick={() => void markRead(item)}><span className="studioNotificationDot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.message}</small><time dateTime={item.created_at}>{formatNotificationDate(item.created_at)}</time></span>{item.is_read ? <Check size={15} aria-label="Lue" /> : <span className="srOnly">Marquer comme lue</span>}</button></li>)}</ul> : null}
        </div>
      ) : null}
    </div>
  );
}
