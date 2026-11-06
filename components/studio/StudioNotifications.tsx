"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/ui";
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
      <button className="studioNotification" type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? ` — ${unread} non lue${unread > 1 ? "s" : ""}` : " — aucune non lue"}`} aria-haspopup="dialog" aria-expanded={open}>
        <Icon name="notification" size={20} aria-hidden="true" />
        {unread ? <span aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications" className="ninoNotificationsSheet">
          <p className="ninoNotificationSummary">{loading ? "Chargement…" : error ? "Chargement incomplet" : unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour"}</p>
          {unread ? <button className="studioMarkAllRead" type="button" onClick={() => void markAllRead()} disabled={acting || loading}>{acting ? <Icon name="loader" className="spin" size={15} /> : <Icon name="check" size={15} />}Tout marquer comme lu</button> : null}
          {loading ? <div className="studioNotificationState" role="status"><Icon name="loader" className="spin" size={20} />Chargement…</div> : null}
          {error && !loading ? <div className="studioNotificationState isError" role="alert"><Icon name="warning" size={20} /><span>{error}</span><button type="button" onClick={() => void load()}><Icon name="retry" size={15} />Réessayer</button></div> : null}
          {!loading && !error && !items.length ? <div className="studioNotificationState"><Icon name="notification" size={24} /><strong>Aucune notification</strong><span>Les alertes de publication et du système apparaîtront ici.</span></div> : null}
          {!loading && items.length ? <ul>{items.map((item) => <li key={item.id} className={`${item.is_read ? "isRead" : ""} is${item.level}`}><button type="button" onClick={() => void markRead(item)}><span className="studioNotificationDot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.message}</small><time dateTime={item.created_at}>{formatNotificationDate(item.created_at)}</time></span>{item.is_read ? <Icon name="check" size={15} decorative={false} label="Lue" /> : <span className="srOnly">Marquer comme lue</span>}</button></li>)}</ul> : null}
        </Sheet>
    </div>
  );
}
