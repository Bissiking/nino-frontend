import { Icon } from "@/components/icons";
import { NinoApiError } from "@/lib/api";
import { Button, StatusView, UiTheme } from "./ui";
import styles from "./ui/ui.module.css";

export function LoadingState({ label = "Chargement de votre espace…", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return <UiTheme fullHeight={fullScreen}><StatusView title={label} message="Encore un instant, nous préparons la suite."
    icon={<Icon name="loader" size={28} className={styles.spin} />} /></UiTheme>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <UiTheme fullHeight={false}><StatusView title={title} message={message} icon={<Icon name="video" size={28} />} /></UiTheme>;
}

export function ErrorState({ message, onRetry, error }: { message: string; onRetry?: () => void; error?: Error }) {
  const network = error instanceof NinoApiError && error.code === "NETWORK_ERROR";
  const denied = error instanceof NinoApiError && error.status === 403;
  const auth = error instanceof NinoApiError && error.status === 401;
  const title = auth ? "Retrouvons votre espace." : denied ? "Ce contenu n’est pas accessible." : network ? "La connexion à Nino est interrompue." : "Ce contenu se fait attendre.";
  const description = auth ? "Reconnectez-vous pour retrouver vos programmes et votre profil." : denied ? "Votre compte ou votre profil ne permet pas d’accéder à ce contenu." : network ? "Nous n’arrivons pas à joindre le serveur. Vérifiez votre connexion, puis réessayez dans quelques instants." : message;
  return <UiTheme fullHeight={false}><StatusView title={title} message={description} role="alert"
    icon={network ? <Icon name="offline" size={28} /> : denied || auth ? <Icon name="lock" size={28} /> : <Icon name="warning" size={28} />}
    action={auth ? <a href="/login">Se connecter</a> : onRetry ? <Button onClick={onRetry}><Icon name="retry" size={18} />Réessayer</Button> : undefined} /></UiTheme>;
}
