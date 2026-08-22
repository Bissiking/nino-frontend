"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CircleDot,
  HardDrive,
  Loader2,
  Play,
  RotateCw,
  ServerCog,
  Square,
  WifiOff
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import type { MediaItem, TranscodeJob, TranscodeSnapshot, TranscodeWorkerControl } from "@/types/nino";

const STATUS_LABELS: Record<TranscodeJob["status"], string> = {
  pending: "En attente",
  running: "En cours",
  failed: "Échoué",
  done: "Terminé"
};

function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatAge(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

export default function StudioTranscodePage() {
  const [snapshot, setSnapshot] = useState<TranscodeSnapshot | null>(null);
  const [worker, setWorker] = useState<TranscodeWorkerControl | null>(null);
  const [mediaTitles, setMediaTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [live, setLive] = useState<"connecting" | "connected" | "offline">("connecting");
  const [acting, setActing] = useState<"start" | "stop" | null>(null);
  const [forcing, setForcing] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const loadWorker = useCallback(async () => {
    try {
      const user = await api.me();
      if (!user.is_admin) {
        setAccessDenied(true);
        return;
      }
      const [control, media] = await Promise.all([
        api.adminTranscodeWorkerStatus(),
        api.adminMedia().catch(() => [] as MediaItem[])
      ]);
      setWorker(control);
      setMediaTitles(Object.fromEntries(media.map((m) => [m.id, m.title])));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger le statut du worker.");
    } finally {
      setLoading(false);
    }
  }, []);

  const connectLive = useCallback(() => {
    abortRef.current?.();
    setLive("connecting");
    abortRef.current = api.adminTranscodeLive(
      (data) => {
        setSnapshot(data);
        setLive("connected");
        setError(null);
      },
      () => setLive("offline")
    );
  }, []);

  useEffect(() => {
    void loadWorker();
    connectLive();
    return () => abortRef.current?.();
  }, [connectLive, loadWorker]);

  const controlWorker = useCallback(async (action: "start" | "stop") => {
    setActing(action);
    try {
      setWorker(action === "start" ? await api.adminTranscodeWorkerStart() : await api.adminTranscodeWorkerStop());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de contrôler le worker.");
    } finally {
      setActing(null);
    }
  }, []);

  const forceJob = useCallback(async (jobId: string) => {
    setForcing(jobId);
    setActionNotice(null);
    setError(null);
    try {
      await api.adminTranscodeForce(jobId);
      setSnapshot((current) => {
        if (!current) return current;
        const previous = current.jobs.find((job) => job.id === jobId);
        const counts = previous && previous.status !== "pending" ? {
          ...current.counts,
          [previous.status]: Math.max(0, current.counts[previous.status] - 1),
          pending: current.counts.pending + 1
        } : current.counts;
        return {
          ...current,
          counts,
          running: current.running?.id === jobId ? null : current.running,
          jobs: current.jobs.map((job) => job.id === jobId ? {
            ...job,
            status: "pending",
            attempts: 0,
            error: null,
            progress: 0,
            stage: null,
            stale: false,
            worker: null,
            started_at: null,
            finished_at: null,
            last_heartbeat: null
          } : job)
        };
      });

      if (snapshot?.worker_enabled === false) {
        setActionNotice("Job rendu prioritaire, mais le worker est désactivé dans la configuration.");
        return;
      }
      const workerIsRunning = worker?.mode === "systemd"
        ? worker.systemd_active === true
        : worker?.managed_alive === true;
      if (!workerIsRunning) {
        try {
          setWorker(await api.adminTranscodeWorkerStart());
          setActionNotice("Transcodage prioritaire demandé et worker démarré.");
        } catch (startReason) {
          setActionNotice("Job rendu prioritaire, mais le worker n’a pas pu démarrer automatiquement.");
          setError(startReason instanceof Error ? startReason.message : "Impossible de démarrer le worker.");
        }
      } else {
        setActionNotice("Transcodage prioritaire demandé. Il démarrera dès que le worker sera libre.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de forcer le transcodage.");
    } finally {
      setForcing(null);
    }
  }, [snapshot?.worker_enabled, worker]);

  const counts = snapshot?.counts ?? { pending: 0, running: 0, failed: 0, done: 0 };
  const systemMode = worker?.mode === "systemd";
  const controlRunning = systemMode ? worker?.systemd_active === true : worker?.managed_alive === true;
  const failedJobs = snapshot?.jobs.filter((job) => job.status === "failed") ?? [];

  return (
    <AppShell>
      <div className="studioSurface">
        <div className="studioTitlebar">
          <div>
            <h1>Transcodage</h1>
            <p>Worker, files d’attente et jobs de transcodage en temps réel.</p>
          </div>
          <Link className="secondaryButton" href="/studio">
            <ArrowLeft size={17} aria-hidden="true" /> Retour au Studio
          </Link>
        </div>

        {accessDenied ? (
          <div className="studioAccessDenied">
            <CircleDot size={30} aria-hidden="true" />
            <h2>Accès administrateur requis</h2>
            <p>Le contrôle du worker de transcodage est réservé aux comptes administrateurs.</p>
          </div>
        ) : null}

        {loading ? <LoadingState label="Connexion au flux du worker" /> : null}

        {error && !loading ? (
          <ErrorState
            message={error}
            onRetry={() => {
              void loadWorker();
              connectLive();
            }}
          />
        ) : null}

        {!loading && !accessDenied ? (
          <>
            <section className="transcodeLiveBar">
              <span className={`transcodeLiveBadge ${live}`}>
                {live === "connected" ? (
                  <Activity size={15} aria-hidden="true" />
                ) : live === "connecting" ? (
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                ) : (
                  <WifiOff size={15} aria-hidden="true" />
                )}
                {live === "connected" ? "En direct" : live === "connecting" ? "Connexion…" : "Flux coupé"}
              </span>
              {live === "offline" ? (
                <button className="secondaryButton" type="button" onClick={connectLive}>
                  <RotateCw size={15} aria-hidden="true" /> Reconnecter
                </button>
              ) : null}
            </section>

            <section className="studioListPanel">
              <div className="studioPanelHeading">
                <div>
                  <h2>Contrôle du worker</h2>
                  <p>{systemMode ? `Service systemd « ${worker?.systemd_service} »` : "Process lancé par Nino"}</p>
                </div>
                <ServerCog size={20} aria-hidden="true" />
              </div>
              <div className="transcodeWorkerBody">
                <dl className="transcodeWorkerMeta">
                  <div>
                    <dt>État</dt>
                    <dd>
                      <span className={`transcodeStatus ${controlRunning ? "isRunning" : "isIdle"}`}>
                        {controlRunning ? "Actif" : "Arrêté"}
                      </span>
                    </dd>
                  </div>
                  {systemMode ? (
                    <>
                      <div>
                        <dt>Service</dt>
                        <dd>{worker?.systemd_service ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>systemd</dt>
                        <dd>
                          <span className={`transcodeStatus ${worker?.systemd_active ? "isRunning" : "isIdle"}`}>
                            {worker?.systemd_active ? "active" : "inactive"}
                          </span>
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>PID</dt>
                        <dd>{worker?.managed_pid ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Process</dt>
                        <dd>
                          <span className={`transcodeStatus ${worker?.managed_alive ? "isRunning" : "isIdle"}`}>
                            {worker?.managed_alive ? "en vie" : "arrêté"}
                          </span>
                        </dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt>Heartbeat</dt>
                    <dd>
                      {snapshot?.worker ? (
                        <span className={`transcodeStatus ${snapshot.worker.alive ? "isRunning" : "isFailed"}`}>
                          {snapshot.worker.name ?? "worker"} · {formatAge(snapshot.worker.age_seconds)}
                        </span>
                      ) : (
                        <span className="transcodeStatus isIdle">aucun</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Fenêtre</dt>
                    <dd>{snapshot ? `${snapshot.window.start} → ${snapshot.window.end}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Pile de jobs</dt>
                    <dd>{snapshot ? `${counts.pending} en attente · ${counts.running} en cours` : "—"}</dd>
                  </div>
                </dl>
                <div className="transcodeWorkerActions">
                  <button
                    className="primaryButton"
                    type="button"
                    disabled={acting !== null || controlRunning}
                    onClick={() => void controlWorker("start")}
                  >
                    {acting === "start" ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                    Démarrer
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    disabled={acting !== null || !controlRunning}
                    onClick={() => void controlWorker("stop")}
                  >
                    {acting === "stop" ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Square size={17} aria-hidden="true" />}
                    Arrêter
                  </button>
                </div>
              </div>
            </section>

            <section className="transcodeCounts" aria-label="Compteurs de jobs">
              <div className="transcodeCount"><span>En attente</span><strong>{counts.pending}</strong></div>
              <div className="transcodeCount isRunning"><span>En cours</span><strong>{counts.running}</strong></div>
              <div className="transcodeCount isFailed"><span>Échoués</span><strong>{counts.failed}</strong></div>
              <div className="transcodeCount isDone"><span>Terminés</span><strong>{counts.done}</strong></div>
            </section>

            {snapshot?.running ? (
              <section className="studioListPanel">
                <div className="studioPanelHeading">
                  <div>
                    <h2>Job en cours</h2>
                    <p>{mediaTitles[snapshot.running.media_id] ?? snapshot.running.media_id}</p>
                  </div>
                  {snapshot.running.stale ? <AlertTriangle size={20} aria-hidden="true" /> : <Activity size={20} aria-hidden="true" />}
                </div>
                <div className="transcodeRunningJob">
                  <div className="transcodeRunningJobHead">
                    <strong>{mediaTitles[snapshot.running.media_id] ?? snapshot.running.media_id}</strong>
                    <span>{snapshot.running.worker ?? "—"}</span>
                  </div>
                  <div
                    className="transcodeProgressTrack"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={snapshot.running.progress ?? 0}
                  >
                    <i style={{ width: `${snapshot.running.progress ?? 0}%` }} />
                  </div>
                  <div className="transcodeRunningJobMeta">
                    <span>Étape : {snapshot.running.stage ?? "—"}</span>
                    <span>Progression : {snapshot.running.progress ?? 0} %</span>
                    <span>Depuis : {formatAge(snapshot.running.heartbeat_age_seconds)}</span>
                    {snapshot.running.stale ? <strong className="transcodeStale">Aucun heartbeat — job probablement bloqué</strong> : null}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="studioListPanel">
              <div className="studioPanelHeading">
                <div>
                  <h2>File de jobs</h2>
                  <p>Lancez un job en priorité, même hors de la fenêtre horaire.</p>
                </div>
                <HardDrive size={20} aria-hidden="true" />
              </div>
              {actionNotice ? (
                <div className="transcodeActionNotice" role="status">
                  <CircleDot size={16} aria-hidden="true" />
                  <span>{actionNotice}</span>
                </div>
              ) : null}
              {!snapshot?.jobs.length ? (
                <div className="studioCompactEmpty">
                  <CircleDot size={18} aria-hidden="true" />
                  <p>Aucun job de transcodage.</p>
                </div>
              ) : (
                <div className="studioTableWrap">
                  <table className="studioTable transcodeTable">
                    <thead>
                      <tr>
                        <th>Média</th>
                        <th>Statut</th>
                        <th>Progression</th>
                        <th>Étape</th>
                        <th>Worker</th>
                        <th>Début</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot?.jobs.map((job) => {
                        const canForce = job.status === "pending" || job.status === "failed" || (job.status === "running" && job.stale);
                        return (
                          <tr key={job.id} className={job.status === "running" ? "isSelected" : ""}>
                            <td>
                              <strong>{mediaTitles[job.media_id] ?? job.media_id}</strong>
                              <small>{job.id}</small>
                            </td>
                            <td>
                              <span className={`transcodeStatus is${job.status[0].toUpperCase()}${job.status.slice(1)}`}>
                                {STATUS_LABELS[job.status]}
                              </span>
                              {job.stale ? <small className="transcodeStale">stale</small> : null}
                            </td>
                            <td>{job.progress != null ? `${job.progress} %` : "—"}</td>
                            <td>{job.stage ?? "—"}</td>
                            <td>{job.worker ?? "—"}</td>
                            <td>{formatTime(job.started_at ?? job.created_at)}</td>
                            <td>
                              {canForce ? (
                                <button
                                  className="transcodeForceButton"
                                  type="button"
                                  title="Lancer en priorité, même hors de la fenêtre horaire"
                                  disabled={forcing !== null}
                                  onClick={() => void forceJob(job.id)}
                                >
                                  {forcing === job.id ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                                  {forcing === job.id ? "Lancement…" : "Lancer maintenant"}
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {failedJobs.some((job) => job.error) ? (
                <div className="transcodeErrorNote">
                  <AlertTriangle size={15} aria-hidden="true" />
                  {failedJobs.map((job) =>
                    job.error ? <p key={job.id}>{job.id} : {job.error}</p> : null
                  )}
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
