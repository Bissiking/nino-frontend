import { AlertTriangle, Loader2, RotateCw } from "lucide-react";

export function LoadingState({ label = "Chargement" }: { label?: string }) {
  return (
    <div className="stateBlock" role="status">
      <Loader2 className="spin" size={24} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="stateBlock">
      <p className="stateTitle">{title}</p>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="stateBlock errorState" role="alert">
      <AlertTriangle size={24} aria-hidden="true" />
      <p className="stateTitle">Impossible de charger</p>
      <p>{message}</p>
      {onRetry ? (
        <button className="secondaryButton" type="button" onClick={onRetry}>
          <RotateCw size={17} aria-hidden="true" />
          Reessayer
        </button>
      ) : null}
    </div>
  );
}

