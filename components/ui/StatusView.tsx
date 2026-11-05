import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function StatusView({ title, message, icon, action, role = "status", heading = "h2" }: {
  title: string;
  message: string;
  icon: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  return <section className={styles.statusView} role={role}>
    <span className={styles.statusIcon} aria-hidden="true">{icon}</span>
    <Heading>{title}</Heading>
    <p>{message}</p>
    {action ? <div className={styles.actions}>{action}</div> : null}
  </section>;
}
