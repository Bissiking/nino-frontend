import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Button, IconButton } from "./Button";
import styles from "./ui.module.css";

export type Tone = "neutral" | "success" | "warning" | "danger";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export function Alert({ title, children, tone = "neutral", urgent = false }: { title: string; children?: ReactNode; tone?: Tone; urgent?: boolean }) {
  const iconName = tone === "success" ? "success" : tone === "warning" || tone === "danger" ? "warning" : "info";
  return <div className={`${styles.alert} ${styles[tone]}`} role={urgent ? "alert" : "status"}>
    <Icon name={iconName} size={21} /><div><strong>{title}</strong>{children ? <div>{children}</div> : null}</div>
  </div>;
}

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className={styles.toast}><span role="status">{message}</span><IconButton label="Fermer la notification" variant="quiet" onClick={onDismiss}><Icon name="close" size={18} /></IconButton></div>;
}

export function Loader({ label = "Chargement…" }: { label?: string }) {
  return <div className={styles.loader} role="status"><Icon name="loader" size={22} className={styles.spin} />{label}</div>;
}

export function Skeleton({ label = "Chargement du contenu" }: { label?: string }) {
  return <div role="status" className={styles.skeleton}><span className={styles.srOnly}>{label}</span><span /><span /><span /></div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className={styles.state}><h3>{title}</h3><p>{message}</p>{action}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className={styles.state} role="alert"><Icon name="warning" size={28} /><h3>Impossible de charger ce contenu</h3><p>{message}</p>{onRetry ? <Button variant="secondary" onClick={onRetry}>Réessayer</Button> : null}</div>;
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return <div className={styles.state} role="status"><Icon name="offline" size={28} /><h3>Connexion interrompue</h3><p>Vérifiez votre connexion avant de réessayer.</p>{onRetry ? <Button variant="secondary" onClick={onRetry}>Réessayer</Button> : null}</div>;
}

export function ForbiddenState() {
  return <div className={styles.state} role="alert"><Icon name="lock" size={28} /><h3>Accès refusé</h3><p>Ce contenu n’est pas accessible avec vos autorisations actuelles.</p></div>;
}
