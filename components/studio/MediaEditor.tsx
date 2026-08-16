"use client";

import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, BellRing, Bold, CheckCircle2, Code2, FileStack, FileVideo2, FolderOpen, HardDrive, Heading2, Image as ImageIcon, Italic, Layers3, Link2, List, ListOrdered, Loader2, Lock, Minus, Play, Quote, RefreshCw, Save, ShieldAlert, Strikethrough, Table2, Tags, Trash2, TriangleAlert, Upload, VideoOff, X } from "lucide-react";
import { MediaPlayer } from "@/components/MediaPlayer";
import { Markdown } from "@/components/Markdown";
import { api } from "@/lib/api";
import { CATEGORIES, CONTENT_FLAGS, VISIBILITY_LABELS } from "@/types/nino";
import type { MediaItem, MediaWritePayload, StreamDecision } from "@/types/nino";
import { extractVideoCandidates, parseVideoFilename, readVideoDuration } from "./videoUtils";
import type { FrameAspect, VideoFrameCandidate } from "./videoUtils";

type SourceMode = "file" | "hls";
type MediaKind = "movie" | "short" | "series";
type VisualField = "thumbnail" | "thumbnail_vertical" | "poster" | "backdrop";
type VisualUrlKey = "thumbnailUrl" | "thumbnailVerticalUrl" | "posterUrl" | "backdropUrl";

const CATEGORY_HINTS: Record<string, string> = {
  gaming: "Gameplay et univers vidéoludiques",
  letsplay: "Parties commentées",
  defi: "Challenges et objectifs",
  tutoriel: "Explications et démarches",
  vlog: "Journal quotidien",
  life: "Style de vie et tranches de vie",
  talk: "Discussions et réactions",
  documentaire: "Récits et enquêtes",
  autre: "Hors des autres thèmes"
};

type MdAction = {
  id: string;
  label: string;
  hint: string;
  Icon: typeof Bold;
  prefix: string;
  suffix: string;
  placeholder: string;
  block?: boolean;
};

const MD_ACTIONS: MdAction[] = [
  { id: "bold", label: "Gras", hint: "Met le texte en gras", Icon: Bold, prefix: "**", suffix: "**", placeholder: "texte en gras" },
  { id: "italic", label: "Italique", hint: "Met le texte en italique", Icon: Italic, prefix: "*", suffix: "*", placeholder: "texte en italique" },
  { id: "strike", label: "Barré", hint: "Rayé le texte", Icon: Strikethrough, prefix: "~~", suffix: "~~", placeholder: "texte barré" },
  { id: "heading", label: "Titre", hint: "Transforme la ligne en titre (plus grand)", Icon: Heading2, prefix: "## ", suffix: "", placeholder: "Titre de section", block: true },
  { id: "quote", label: "Citation", hint: "Présente le texte comme une citation", Icon: Quote, prefix: "> ", suffix: "", placeholder: "Citation", block: true },
  { id: "link", label: "Lien", hint: "Ajoute un lien cliquable", Icon: Link2, prefix: "[", suffix: "](https://exemple.fr)", placeholder: "texte du lien" },
  { id: "code", label: "Code", hint: "Affiche du texte en code", Icon: Code2, prefix: "`", suffix: "`", placeholder: "code" },
  { id: "list", label: "Liste à puces", hint: "Crée une liste à puces", Icon: List, prefix: "- ", suffix: "", placeholder: "élément de liste", block: true },
  { id: "numbered", label: "Liste numérotée", hint: "Crée une liste numérotée", Icon: ListOrdered, prefix: "1. ", suffix: "", placeholder: "élément numéroté", block: true },
  { id: "image", label: "Image", hint: "Insère une image via son adresse", Icon: ImageIcon, prefix: "![", suffix: "](https://image.jpg)", placeholder: "description de l’image" },
  { id: "table", label: "Tableau", hint: "Insère un tableau", Icon: Table2, prefix: "| Colonne 1 | Colonne 2 |\n| --- | --- |\n| Valeur 1 | Valeur 2 |", suffix: "", placeholder: "", block: true },
  { id: "divider", label: "Séparateur", hint: "Insère une ligne horizontale", Icon: Minus, prefix: "\n\n---\n\n", suffix: "", placeholder: "", block: true }
];

const VISUAL_FIELDS: { field: VisualField; urlKey: VisualUrlKey; apiKey: "poster_url" | "backdrop_url" | "thumbnail_url" | "thumbnail_vertical_url"; label: string; hint: string }[] = [
  { field: "thumbnail", urlKey: "thumbnailUrl", apiKey: "thumbnail_url", label: "Miniature horizontale", hint: "16:9, aperçu « à suivre » dans le lecteur" },
  { field: "thumbnail_vertical", urlKey: "thumbnailVerticalUrl", apiKey: "thumbnail_vertical_url", label: "Miniature verticale", hint: "9:16, affiche du flux Flashy" },
  { field: "poster", urlKey: "posterUrl", apiKey: "poster_url", label: "Affiche", hint: "2:3, artwork principal des cartes et de la fiche" },
  { field: "backdrop", urlKey: "backdropUrl", apiKey: "backdrop_url", label: "Arrière-plan", hint: "16:9, bandeau de la fiche et de la lecture" }
];

type Props = {
  kind: MediaKind;
  media?: MediaItem | null;
  onCancel: () => void;
  onSaved: (media: MediaItem) => void;
  onDeleted?: (media: MediaItem) => void;
  variant?: "panel" | "page";
  decision?: StreamDecision | null;
  previewError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return "Non renseignée";
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go", "To"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: value >= 10 ? 1 : 2 })} ${unit}`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function activeFlags(media?: MediaItem | null): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  (media?.content_flags ?? []).forEach((flag) => {
    result[flag] = true;
  });
  return result;
}

function initialForm(kind: MediaKind, media?: MediaItem | null) {
  return {
    kind,
    title: media?.title ?? "",
    synopsis: media?.synopsis ?? "",
    description: media?.description ?? "",
    category: media?.category ?? "",
    tags: media?.tags ?? [],
    year: media?.year?.toString() ?? "",
    duration: media?.duration_seconds?.toString() ?? "0",
    genres: media?.genres.join(", ") ?? (kind === "short" ? "Flashy" : ""),
    posterUrl: media?.poster_url ?? "",
    backdropUrl: media?.backdrop_url ?? "",
    thumbnailUrl: media?.thumbnail_url ?? "",
    thumbnailVerticalUrl: media?.thumbnail_vertical_url ?? "",
    visibility: media?.visibility ?? "draft",
    publishAt: media?.publish_at ? media.publish_at.slice(0, 16) : "",
    isAvailable: media?.is_available ?? true,
    notifyDiscord: media?.notify_discord ?? false,
    noSpoil: media?.no_spoil ?? false,
    isAdult: media?.is_adult ?? false,
    flags: activeFlags(media),
    seriesId: media?.series_source_id ?? "",
    seasonNumber: media?.season_number?.toString() ?? "1",
    episodeNumber: media?.episode_number?.toString() ?? ""
  };
}

function UploadProgressIndicator({ uploadProgress }: { uploadProgress: { loaded: number; total: number } | null }) {
  const sending = uploadProgress !== null && uploadProgress.loaded < uploadProgress.total;
  const percent = uploadProgress && uploadProgress.total > 0
    ? Math.min(100, Math.round((uploadProgress.loaded / uploadProgress.total) * 100))
    : 0;
  return (
    <div className={sending ? "v7UploadProgress" : "v7UploadProgress isProcessing"} role="status">
      <span aria-hidden="true"><i style={{ width: `${sending ? percent : 42}%` }} /></span>
      <strong>{sending ? `Envoi vers Nino… ${percent}%` : "Traitement en cours…"}</strong>
    </div>
  );
}

export function MediaEditor({ kind, media, onCancel, onSaved, onDeleted, variant = "panel", decision = null, previewError = null, refreshing = false, onRefresh }: Props) {
  const [form, setForm] = useState(() => initialForm(kind, media));
  const [seriesOptions, setSeriesOptions] = useState<MediaItem[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [descMode, setDescMode] = useState<"edit" | "preview">("edit");
  const [isMac] = useState(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || ""));
  const [uploading, setUploading] = useState<VisualField | null>(null);
  const [pendingImages, setPendingImages] = useState<Partial<Record<VisualField, File>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [genreDraft, setGenreDraft] = useState("");
  const [genrePasteFeedback, setGenrePasteFeedback] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<VideoFrameCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractHint, setExtractHint] = useState<string | null>(null);
  const [autoFillNote, setAutoFillNote] = useState<string | null>(null);
  const [tagPasteFeedback, setTagPasteFeedback] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const mdTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tagPasteTimerRef = useRef<number | null>(null);
  const genrePasteTimerRef = useRef<number | null>(null);
  const pendingSourceUrlRef = useRef<string | null>(null);
  const editorFormRef = useRef<HTMLFormElement>(null);
  const isEditing = Boolean(media);
  const isPage = variant === "page";
  const isSeries = form.kind === "series";
  const isShort = form.kind === "short";
  const sourceStepShown = !isEditing && !isSeries;
  const anyFlag = Boolean(form.flags && Object.values(form.flags).some(Boolean));

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        editorFormRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    setForm(initialForm(kind, media));
    setFiles([]);
    setError(null);
    setSuccess(null);
    setDirty(false);
    setCandidates([]);
    setSelectedCandidateId(null);
    setExtractHint(null);
    setAutoFillNote(null);
    setTagDraft("");
    setGenreDraft("");
  }, [kind, media]);

  useEffect(() => {
    api.adminMedia()
      .then((items) => setSeriesOptions(items.filter((item) => item.kind === "series")))
      .catch(() => setSeriesOptions([]));
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (sourceMode === "hls") input.setAttribute("webkitdirectory", "");
    else input.removeAttribute("webkitdirectory");
  }, [sourceMode]);

  useEffect(() => {
    if (!error) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    feedbackRef.current?.focus({ preventScroll: true });
  }, [error]);

  const packageInfo = useMemo(() => {
    const playlists = files.filter((file) => file.name.toLowerCase().endsWith(".m3u8")).length;
    const segments = files.filter((file) => /\.(ts|m4s)$/i.test(file.name)).length;
    const bytes = files.reduce((total, file) => total + file.size, 0);
    return { playlists, segments, bytes };
  }, [files]);

  function markDirty() {
    setDirty(true);
    setSuccess(null);
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "seriesId") {
        next.seasonNumber = "1";
        next.episodeNumber = "";
      }
      return next;
    });
    markDirty();
  }

  function toggleFlag(flag: string) {
    setForm((current) => ({ ...current, flags: { ...current.flags, [flag]: !current.flags[flag] } }));
    markDirty();
  }

  function appendTag(tag: string) {
    const next = tag.trim().replace(/,+$/, "").trim();
    if (!next) return;
    if (form.tags.includes(next)) return;
    setForm((current) => ({ ...current, tags: [...current.tags, next] }));
    markDirty();
  }

  function removeTag(tag: string) {
    setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
    markDirty();
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === " ") {
      event.preventDefault();
      appendTag(tagDraft);
      setTagDraft("");
    } else if (event.key === "Backspace" && !event.currentTarget.value && form.tags.length) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  }

  function handleTagPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    event.preventDefault();
    const draftTag = tagDraft.trim().replace(/,+$/, "").trim();
    const existing = new Set(draftTag ? [...form.tags, draftTag] : form.tags);
    if (draftTag) {
      appendTag(tagDraft);
      setTagDraft("");
    }
    const fragments = pasted.split(/[\s,;]+/).map((fragment) => fragment.replace(/^[,;]+|[,;]+$/g, "").trim()).filter(Boolean);
    const added: string[] = [];
    for (const fragment of fragments) {
      if (existing.has(fragment)) continue;
      existing.add(fragment);
      added.push(fragment);
    }
    if (added.length) {
      setForm((current) => ({ ...current, tags: [...current.tags, ...added] }));
      markDirty();
      setTagPasteFeedback(added.length);
      if (tagPasteTimerRef.current !== null) window.clearTimeout(tagPasteTimerRef.current);
      tagPasteTimerRef.current = window.setTimeout(() => setTagPasteFeedback(null), 2600);
    }
  }

  function genreList(): string[] {
    return form.genres.split(",").map((genre) => genre.trim()).filter(Boolean);
  }

  function appendGenre(genre: string) {
    const next = genre.trim();
    if (!next) return;
    const list = genreList();
    if (list.includes(next)) return;
    setForm((current) => ({ ...current, genres: [...list, next].join(", ") }));
    markDirty();
  }

  function removeGenre(genre: string) {
    setForm((current) => ({ ...current, genres: genreList().filter((item) => item !== genre).join(", ") }));
    markDirty();
  }

  function onGenreKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      appendGenre(genreDraft);
      setGenreDraft("");
    } else if (event.key === "Backspace" && !event.currentTarget.value && genreList().length) {
      removeGenre(genreList()[genreList().length - 1]);
    }
  }

  function handleGenrePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    event.preventDefault();
    const draftGenre = genreDraft.trim();
    if (draftGenre) {
      appendGenre(draftGenre);
      setGenreDraft("");
    }
    const list = genreList();
    const existing = new Set(list);
    const added: string[] = [];
    for (const fragment of pasted.split(/[\s,;]+/).map((fragment) => fragment.replace(/^[,;]+|[,;]+$/g, "").trim()).filter(Boolean)) {
      if (existing.has(fragment)) continue;
      existing.add(fragment);
      added.push(fragment);
    }
    if (added.length) {
      setForm((current) => ({ ...current, genres: [...list, ...added].join(", ") }));
      markDirty();
      setGenrePasteFeedback(added.length);
      if (genrePasteTimerRef.current !== null) window.clearTimeout(genrePasteTimerRef.current);
      genrePasteTimerRef.current = window.setTimeout(() => setGenrePasteFeedback(null), 2600);
    }
  }

  function applyMd(action: MdAction) {
    const textarea = mdTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const value = form.description;
    const selected = value.slice(start, end);
    let next: string;
    let caret: number;

    if (action.block) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", end);
      const lineEndIndex = lineEnd === -1 ? value.length : lineEnd;
      const before = value.slice(0, lineStart);
      const after = value.slice(lineEndIndex);
      const content = selected || action.placeholder;
      next = `${before}${action.prefix}${content}${action.suffix}${after}`;
      caret = lineStart + action.prefix.length + (selected ? 0 : content.length);
    } else {
      const wrapped = `${action.prefix}${selected || action.placeholder}${action.suffix}`;
      next = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
      caret = start + action.prefix.length + (selected ? selected.length : 0);
    }

    setForm((current) => {
      if (current.description === next) return current;
      return { ...current, description: next };
    });
    markDirty();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  function restorePublishInfo() {
    if (!isEditing || !media) return;
    setForm((current) => ({
      ...current,
      publishAt: media.publish_at ? media.publish_at.slice(0, 16) : "",
      visibility: media.visibility,
      isAvailable: media.is_available,
    }));
    markDirty();
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setDeleteOpen(false);
    setDeleteError(null);
  }

  async function makePrivate() {
    if (!media) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const updated = await api.updateAdminMedia(media.id, { visibility: "private" });
      setForm((current) => ({ ...current, visibility: "private" }));
      setSuccess("Le média est passé en privé. Il reste modifiable dans Nino Studio.");
      onSaved(updated);
      setDeleteOpen(false);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "Impossible de passer ce média en privé.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function confirmDelete() {
    if (!media) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.deleteAdminMedia(media.id);
      onDeleted?.(media);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "La suppression du média a échoué.");
      setDeleteBusy(false);
    }
  }

  useEffect(() => {
    if (!deleteOpen) return;
    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      (deleteDialogRef.current?.querySelector<HTMLButtonElement>("button") ?? deleteDialogRef.current)?.focus();
    }, 0);
    function onDeleteKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDeleteModal();
      }
    }
    window.addEventListener("keydown", onDeleteKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onDeleteKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteOpen]);

  function frameAspects(): FrameAspect[] {
    const aspects: FrameAspect[] = ["landscape"];
    if (form.kind === "short") aspects.push("portrait");
    return aspects;
  }

  async function runExtraction(source: string, aspects?: FrameAspect[]) {
    setExtracting(true);
    setExtractHint(null);
    setSelectedCandidateId(null);
    try {
      const frames = await extractVideoCandidates(source, aspects ?? frameAspects());
      setCandidates((current) => {
        const kept = current.filter((item) => !frames.some((frame) => frame.aspect === item.aspect));
        return [...kept, ...frames];
      });
    } catch (reason) {
      setExtractHint(reason instanceof Error ? reason.message : "Impossible de générer les miniatures.");
    } finally {
      setExtracting(false);
    }
  }

  function startFileExtraction(chosen: File[]) {
    if (isSeries) return;
    const video = chosen.find((file) => file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(file.name));
    if (!video) return;
    if (pendingSourceUrlRef.current) URL.revokeObjectURL(pendingSourceUrlRef.current);
    const objectUrl = URL.createObjectURL(video);
    pendingSourceUrlRef.current = objectUrl;
    void runExtraction(objectUrl);
  }

  function autoFillFromFile(file: File) {
    const parsed = parseVideoFilename(file.name);
    let filledTitle = "";
    setForm((current) => {
      const next = { ...current };
      if (!next.title.trim() && parsed.title) {
        next.title = parsed.title;
        filledTitle = parsed.title;
      }
      if (!next.year && parsed.year) next.year = String(parsed.year);
      return next;
    });
    if (!filledTitle && !parsed.year) return;

    const objectUrl = URL.createObjectURL(file);
    readVideoDuration(objectUrl)
      .then((seconds) => {
        const rounded = Math.max(0, Math.round(seconds));
        setForm((current) => (!current.duration || current.duration === "0" ? { ...current, duration: String(rounded) } : current));
        setAutoFillNote(`Auto-remplissage depuis le fichier : titre${rounded > 0 ? ", durée (~${formatDuration(rounded)})" : ""}.`);
        markDirty();
      })
      .catch(() => {
        setAutoFillNote(`Titre pré-rempli depuis le nom du fichier.`);
        markDirty();
      })
      .finally(() => URL.revokeObjectURL(objectUrl));
  }

  function handleFileSelection(chosen: File[]) {
    if (!chosen.length) return;
    setCandidates([]);
    setExtractHint(null);
    setSelectedCandidateId(null);
    if (sourceMode === "file") {
      const video = chosen.find((file) => file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(file.name));
      if (video && !isEditing) autoFillFromFile(video);
      startFileExtraction(chosen);
    }
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    setFiles(chosen);
    setError(null);
    handleFileSelection(chosen);
  }

  function dropFiles(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (!dropped.length) return;
    const chosen = sourceMode === "file" ? dropped.slice(0, 1) : dropped;
    setFiles(chosen);
    setError(null);
    handleFileSelection(chosen);
  }

  useEffect(() => {
    if (isEditing || isSeries || sourceMode !== "file" || form.kind !== "short") return;
    if (pendingSourceUrlRef.current && !candidates.some((candidate) => candidate.aspect === "portrait")) {
      void runExtraction(pendingSourceUrlRef.current, ["portrait"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.kind]);

  useEffect(() => () => {
    if (tagPasteTimerRef.current !== null) window.clearTimeout(tagPasteTimerRef.current);
    if (genrePasteTimerRef.current !== null) window.clearTimeout(genrePasteTimerRef.current);
    if (pendingSourceUrlRef.current) {
      URL.revokeObjectURL(pendingSourceUrlRef.current);
      pendingSourceUrlRef.current = null;
    }
  }, []);

  async function extractFromCurrentMedia() {
    if (!media || isSeries || !decision || decision.mode !== "direct_play") {
      setExtractHint("La génération de miniatures exige une source vidéo en lecture directe.");
      return;
    }
    const source = api.assetUrl(decision.url);
    if (!source) return;
    if (pendingSourceUrlRef.current) URL.revokeObjectURL(pendingSourceUrlRef.current);
    pendingSourceUrlRef.current = source;
    await runExtraction(source);
  }

  async function uploadVisual(field: VisualField, urlKey: VisualUrlKey, file: File) {
    setError(null);
    if (isEditing && media) {
      setUploading(field);
      try {
        const updated = await api.uploadMediaImage(media.id, field, file);
        const apiKey = VISUAL_FIELDS.find((entry) => entry.field === field)!.apiKey;
        setForm((current) => ({ ...current, [urlKey]: updated[apiKey] ?? "" }));
        markDirty();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "L’envoi de l’image a échoué.");
      } finally {
        setUploading(null);
      }
      return;
    }
    setPendingImages((current) => ({ ...current, [field]: file }));
    markDirty();
  }

  function pickCandidate(candidate: VideoFrameCandidate) {
    if (candidate.aspect === "portrait") {
      if (isEditing && media) void uploadVisual("thumbnail_vertical", "thumbnailVerticalUrl", candidate.file);
      else setPendingImages((current) => ({ ...current, thumbnail_vertical: candidate.file }));
    } else {
      if (isEditing && media) void uploadVisual("thumbnail", "thumbnailUrl", candidate.file);
      else setPendingImages((current) => ({ ...current, thumbnail: candidate.file }));
    }
    setSelectedCandidateId(candidate.id);
    if (!isEditing) markDirty();
  }

  async function removeVisual(field: VisualField, urlKey: VisualUrlKey) {
    setError(null);
    if (pendingImages[field]) {
      setPendingImages((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
      setForm((current) => ({ ...current, [urlKey]: "" }));
      setSelectedCandidateId(null);
      markDirty();
      return;
    }
    if (!isEditing || !media) return;
    setUploading(field);
    try {
      const updated = await api.deleteMediaImage(media.id, field);
      const apiKey = VISUAL_FIELDS.find((entry) => entry.field === field)!.apiKey;
      setForm((current) => ({ ...current, [urlKey]: updated[apiKey] ?? "" }));
      setSelectedCandidateId(null);
      markDirty();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La suppression de l’image a échoué.");
    } finally {
      setUploading(null);
    }
  }

  function selectSourceMode(mode: SourceMode) {
    setSourceMode(mode);
    setFiles([]);
    setCandidates([]);
    setSelectedCandidateId(null);
    setExtractHint(null);
    setAutoFillNote(null);
  }

  function moveSourceMode(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const nextMode: SourceMode = sourceMode === "file" ? "hls" : "file";
    selectSourceMode(nextMode);
    const button = event.currentTarget.querySelector<HTMLButtonElement>(`[data-source-mode="${nextMode}"]`);
    button?.focus();
  }

  function payload(): MediaWritePayload {
    const flags = Object.keys(form.flags).filter((flag) => form.flags[flag]);
    const season = form.seriesId ? Number(form.seasonNumber || 1) : null;
    const episode = form.seriesId ? (form.episodeNumber ? Number(form.episodeNumber) : null) : null;
    return {
      kind: form.kind,
      title: form.title.trim(),
      synopsis: form.synopsis.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
      year: form.year ? Number(form.year) : null,
      duration_seconds: Number(form.duration || 0),
      genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
      poster_url: form.posterUrl.trim() || null,
      backdrop_url: form.backdropUrl.trim() || null,
      thumbnail_url: form.thumbnailUrl.trim() || null,
      thumbnail_vertical_url: form.thumbnailVerticalUrl.trim() || null,
      visibility: form.visibility,
      publish_at: form.publishAt ? new Date(form.publishAt).toISOString() : null,
      is_available: form.isAvailable,
      notify_discord: form.notifyDiscord,
      no_spoil: form.noSpoil,
      is_adult: form.isAdult || flags.length > 0,
      content_flags: flags,
      series_source_id: form.seriesId.trim() || null,
      season_number: season,
      episode_number: episode
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.title.trim()) {
      setError("Donnez un titre au contenu avant de l’enregistrer.");
      return;
    }
    if (!isSeries && !isEditing && !files.length) {
      setError(sourceMode === "hls" ? "Sélectionnez le dossier complet du paquet HLS." : "Sélectionnez une vidéo à envoyer.");
      return;
    }
    if (!isSeries && !isEditing && sourceMode === "hls" && (!packageInfo.playlists || !packageInfo.segments)) {
      setError("Le dossier HLS doit contenir au moins une playlist .m3u8 et des segments .ts ou .m4s.");
      return;
    }

    setBusy(true);
    setUploadProgress(null);
    try {
      const saved = isEditing && media
        ? await api.updateAdminMedia(media.id, payload())
        : await api.createAdminMedia({ ...payload(), source_mode: sourceMode }, files, setUploadProgress);
      const queued = Object.keys(pendingImages) as VisualField[];
      if (queued.length) {
        for (const field of queued) {
          const file = pendingImages[field];
          if (file) await api.uploadMediaImage(saved.id, field, file);
        }
        setPendingImages({});
        const final = await api.adminMediaDetail(saved.id);
        setForm(initialForm(kind, final));
        setDirty(false);
        setSuccess(isEditing ? "Les informations ont été mises à jour." : isSeries ? "La série est prête dans Nino Studio." : "Le média est prêt dans Nino Studio.");
        onSaved(final);
        return;
      }
      setDirty(false);
      setSuccess(isEditing ? "Les informations ont été mises à jour." : isSeries ? "La série est prête dans Nino Studio." : "Le média est prêt dans Nino Studio.");
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L’enregistrement du média a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const sourceSection = !isEditing && !isSeries ? (
    <section className="mediaSourceSection" aria-labelledby="media-source-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-source-title">1) Fichier source</h3><p>Choisissez une vidéo ou un paquet HLS déjà préparé.</p></div>
      <div className="mediaSourceModes" role="radiogroup" aria-label="Format de la source" onKeyDown={moveSourceMode}>
        <button data-source-mode="file" type="button" role="radio" tabIndex={sourceMode === "file" ? 0 : -1} aria-checked={sourceMode === "file"} className={sourceMode === "file" ? "isActive" : undefined} onClick={() => selectSourceMode("file")}><FileVideo2 size={21} /><span><strong>Fichier vidéo</strong><small>MP4, M4V, MOV ou WebM</small></span></button>
        <button data-source-mode="hls" type="button" role="radio" tabIndex={sourceMode === "hls" ? 0 : -1} aria-checked={sourceMode === "hls"} className={sourceMode === "hls" ? "isActive" : undefined} onClick={() => selectSourceMode("hls")}><Layers3 size={21} /><span><strong>HLS multi-qualités</strong><small>Playlists .m3u8 + segments .ts</small></span></button>
      </div>
      <label className={`mediaDropzone ${files.length ? "hasFiles" : ""} ${dragging ? "isDragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={dropFiles}>
        <input ref={inputRef} type="file" multiple={sourceMode === "hls"} accept={sourceMode === "file" ? "video/mp4,video/x-m4v,video/quicktime,video/webm,.mp4,.m4v,.mov,.webm" : undefined} onChange={selectFiles} />
        {files.length ? <CheckCircle2 size={28} /> : sourceMode === "hls" ? <FolderOpen size={28} /> : <Upload size={28} />}
        <span><strong>{files.length ? `${files.length} fichier${files.length > 1 ? "s" : ""} sélectionné${files.length > 1 ? "s" : ""}` : sourceMode === "hls" ? "Glissez le dossier HLS ici" : "Glissez-déposez votre vidéo ici"}</strong><small>{sourceMode === "hls" ? `${packageInfo.playlists} playlist(s) · ${packageInfo.segments} segment(s)` : files[0]?.name ?? "ou sélectionnez un fichier depuis votre appareil"}</small></span>
      </label>
      {autoFillNote ? <small className="mediaAutoFillNote"><CheckCircle2 size={13} aria-hidden="true" />{autoFillNote}</small> : null}
      <small className="v7UploadHelp">MP4, M4V, MOV ou WebM. La taille maximale est contrôlée par le serveur.</small>
    </section>
  ) : null;

  const contentSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-details-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-details-title">{isEditing ? "Contenu" : sourceStepShown ? "2) Métadonnées" : "1) Métadonnées"}</h3><p>Les informations que les spectateurs verront dans le catalogue.</p></div>
      <div className="mediaFieldGrid">
        <label><span>Format</span><select value={form.kind} onChange={(event) => update("kind", event.target.value as MediaKind)}><option value="movie">Vidéo</option><option value="short">Flashy</option><option value="series">Série</option></select></label>
        <label className="isWide"><span>Titre</span><input required maxLength={255} value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
        {!isShort ? <label className="isWide"><span>Synopsis <small>résumé court affiché dans les cartes</small></span><textarea rows={3} maxLength={10000} value={form.synopsis} onChange={(event) => update("synopsis", event.target.value)} /></label> : null}
        {!isShort ? <div className="isWide mediaMdField">
          <span>Description <small>Markdown : **gras**, *italique*, [liens](https://…)</small></span>
          <div className="mediaMdTabs" role="tablist" aria-label="Mode de saisie de la description">
            <button type="button" role="tab" aria-selected={descMode === "edit"} className={descMode === "edit" ? "isActive" : undefined} onClick={() => setDescMode("edit")}>Éditeur</button>
            <button type="button" role="tab" aria-selected={descMode === "preview"} className={descMode === "preview" ? "isActive" : undefined} onClick={() => setDescMode("preview")}>Aperçu</button>
          </div>
          {descMode === "edit" ? (
            <div className="mediaMdToolbar" role="toolbar" aria-label="Outils de mise en forme de la description">
              {MD_ACTIONS.map((action) => (
                <button key={action.id} type="button" data-md-action={action.id} onClick={() => applyMd(action)} title={action.hint} aria-label={action.hint}>
                  <action.Icon size={16} aria-hidden="true" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="mediaMdBody">
            {descMode === "edit" ? (
              <textarea ref={mdTextareaRef} className="mediaMdEditor" rows={9} maxLength={50000} value={form.description} onChange={(event) => update("description", event.target.value)} aria-label="Description" />
            ) : (
              <div className="mediaMdPreview" role="tabpanel" aria-label="Aperçu de la description">
                {form.description.trim() ? <Markdown>{form.description}</Markdown> : <p className="mediaMdEmpty">Rien à afficher. Écrivez du Markdown dans l’éditeur.</p>}
              </div>
            )}
          </div>
        </div> : null}
        <div className="isWide mediaCategoryField">
          <span>Catégorie <small>le thème principal du contenu, visible dans le catalogue</small></span>
          <div className="mediaCategoryPicker" role="radiogroup" aria-label="Catégorie">
            <button type="button" role="radio" tabIndex={form.category ? -1 : 0} aria-checked={!form.category} className={!form.category ? "isSelected" : undefined} onClick={() => update("category", "")}><span className="mediaCategorySwatch isEmpty" aria-hidden="true" /><span><strong>Aucune</strong><small>Non encore classé</small></span></button>
            {Object.entries(CATEGORIES).map(([slug, label]) => (
              <button key={slug} type="button" role="radio" tabIndex={form.category === slug ? 0 : -1} aria-checked={form.category === slug} className={form.category === slug ? "isSelected" : undefined} onClick={() => update("category", form.category === slug ? "" : slug)}><span className="mediaCategorySwatch" data-category={slug} aria-hidden="true" /><span><strong>{label}</strong><small>{CATEGORY_HINTS[slug]}</small></span></button>
            ))}
          </div>
        </div>
        {!isShort ? <label className="isWide">
          <span>Tags <small>Entrée, Espace ou virgule pour valider · clic pour retirer</small></span>
          <span className="mediaTagsPicker" onClick={(event) => { if (event.target === event.currentTarget) tagInputRef.current?.focus(); }}>
            {form.tags.map((tag) => (
              <span key={tag} className="mediaTagChip" onMouseDown={(event) => event.preventDefault()} onClick={() => removeTag(tag)}>
                {tag}
                <button type="button" aria-label={`Retirer le tag ${tag}`} onClick={(event) => { event.stopPropagation(); removeTag(tag); }}><X size={12} aria-hidden="true" /></button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              className="mediaTagsInput"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={onTagKeyDown}
              onPaste={handleTagPaste}
              onBlur={() => { appendTag(tagDraft); setTagDraft(""); }}
              placeholder={form.tags.length ? "" : "Ajouter un tag…"}
              aria-label="Ajouter un tag"
            />
<span className={`mediaTagPasteNote${tagPasteFeedback !== null ? " hasPasted" : ""}`} role="status" aria-live="polite">{tagPasteFeedback !== null ? `${tagPasteFeedback} tag${tagPasteFeedback > 1 ? "s" : ""} ajouté${tagPasteFeedback > 1 ? "s" : ""} · coller une liste pour tout ajouter` : "Coller une liste (une ligne, une virgule ou un espace = un tag)"}</span>
          </span>
        </label> : null}
        {isSeries ? <label><span>Année</span><input type="number" min="1900" max="2200" value={form.year} onChange={(event) => update("year", event.target.value)} /></label> : null}
        <div className="isWide">
          <span>Genres <small>Entrée ou virgule pour valider · clic pour retirer</small></span>
          <span className="mediaTagsPicker" onClick={(event) => { if (event.target === event.currentTarget) genreInputRef.current?.focus(); }}>
            {genreList().map((genre) => (
              <span key={genre} className="mediaGenreChip" onMouseDown={(event) => event.preventDefault()} onClick={() => removeGenre(genre)}>
                {genre}
                <button type="button" aria-label={`Retirer le genre ${genre}`} onClick={(event) => { event.stopPropagation(); removeGenre(genre); }}><X size={12} aria-hidden="true" /></button>
              </span>
            ))}
            <input
              ref={genreInputRef}
              className="mediaTagsInput"
              value={genreDraft}
              onChange={(event) => setGenreDraft(event.target.value)}
              onKeyDown={onGenreKeyDown}
              onPaste={handleGenrePaste}
              onBlur={() => { appendGenre(genreDraft); setGenreDraft(""); }}
              placeholder={genreList().length ? "" : "Ajouter un genre…"}
              aria-label="Ajouter un genre"
            />
            <span className="mediaTagPasteNote" role="status" aria-live="polite">{genrePasteFeedback !== null ? `${genrePasteFeedback} genre${genrePasteFeedback > 1 ? "s" : ""} ajouté${genrePasteFeedback > 1 ? "s" : ""} · coller une liste pour tout ajouter` : "Coller une liste (une virgule ou un espace = un genre)"}</span>
          </span>
        </div>
      </div>
    </section>
  );

  const seriesSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-series-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-series-title">Série, saison &amp; épisode</h3><p>Les épisodes sont numérotés automatiquement dans leur saison. Réordonnez-les depuis le Studio.</p></div>
      <div className="mediaFieldGrid">
        <label className="isWide"><span>Série</span><select value={form.seriesId} onChange={(event) => update("seriesId", event.target.value)}><option value="">Aucune série</option>{seriesOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>
        <label><span>Saison <small>défaut 1</small></span><input type="number" min="1" max="100" disabled={!form.seriesId} value={form.seriesId ? form.seasonNumber : ""} onChange={(event) => update("seasonNumber", event.target.value)} /></label>
        <label><span>Épisode <small>{form.seriesId ? "automatique si vide" : "rattachez une série"}</small></span><input type="number" min="1" disabled={!form.seriesId} value={form.seriesId ? form.episodeNumber : ""} placeholder={form.seriesId ? "Auto" : ""} onChange={(event) => update("episodeNumber", event.target.value)} /></label>
      </div>
    </section>
  );

  const visualFields = VISUAL_FIELDS.filter(({ field }) => {
    if (field === "thumbnail_vertical") return form.kind === "short";
    if (field === "thumbnail") return form.kind === "movie";
    if (form.kind === "short") return false;
    return true;
  });

  const visualSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-visuals-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-visuals-title">{isEditing ? "Visuels" : sourceStepShown ? "4) Visuels" : "3) Visuels"}</h3><p>Affiche, arrière-plan et miniatures pour les cartes et pages de lecture.</p></div>
      <div className="mediaFieldGrid">
        {visualFields.map(({ field, urlKey, label, hint }) => {
          const value = form[urlKey];
          const pending = pendingImages[field];
          const preview = pending ? URL.createObjectURL(pending) : api.assetUrl(value) || null;
          const isUploading = uploading === field;
          return (
            <div key={field} className="mediaImageUpload isWide">
              <span><strong>{label}</strong><small>{hint}</small></span>
              <div className="mediaImageUploadRow">
                <div className="mediaImageUploadPreview">{preview ? <img src={preview} alt={label} /> : <ImageIcon size={22} aria-hidden="true" />}</div>
                <label className="studioUploadButton">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isUploading || busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadVisual(field, urlKey, file);
                      event.currentTarget.value = "";
                    }}
                  />
                  {isUploading ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
                  {isUploading ? "Envoi…" : pending ? "Remplacer" : value ? "Changer" : "Choisir un fichier"}
                </label>
                {(value || pending) ? <button className="studioDeleteButton" type="button" disabled={isUploading || busy} onClick={() => removeVisual(field, urlKey)} title="Retirer cette image"><Trash2 size={16} aria-hidden="true" /><span>Retirer</span></button> : null}
                {pending ? <small className="mediaImagePending">En attente d’enregistrement.</small> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const warningSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-warning-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-warning-title"><ShieldAlert size={19} aria-hidden="true" /> Contenu sensible</h3><p>Dès qu’un flag est sélectionné, le contenu est marqué 18+ et un avertissement s’affiche avant lecture.</p></div>
      <div className="mediaFieldGrid">
        <label className="mediaCheckbox isWide">
          <input type="checkbox" checked={form.isAdult || anyFlag} disabled={anyFlag} onChange={(event) => update("isAdult", event.target.checked)} />
          <span><strong>Contenu sensible (18+)</strong><small>{anyFlag ? "Activé car un flag sensible est sélectionné." : "Affiche un avertissement avant lecture."}</small></span>
        </label>
        {Object.entries(CONTENT_FLAGS).map(([flag, label]) => (
          <label key={flag} className="mediaCheckbox">
            <input type="checkbox" checked={Boolean(form.flags[flag])} onChange={() => toggleFlag(flag)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  );

  const canGenerateThumbnails = !isSeries && Boolean(
    (!isEditing && sourceMode === "file" && files.length > 0) ||
    (isEditing && decision?.mode === "direct_play")
  );
  const hasLandscapeThumb = candidates.some((candidate) => candidate.aspect === "landscape");
  const hasPortraitThumb = candidates.some((candidate) => candidate.aspect === "portrait");

  const thumbnailBlock = canGenerateThumbnails || candidates.length > 0 ? (
    <section className="mediaThumbPicker" aria-labelledby="media-thumbs-title">
      <div className="mediaEditorSectionTitle">
        <h3 id="media-thumbs-title">Miniatures générées</h3>
        <p>{isEditing ? "Extrayez quelques images de la vidéo puis choisissez l’aperçu affiché sur les cartes." : "Les images sont extraites du fichier pour préparer la miniature des cartes."}</p>
      </div>

      {extracting ? <div className="mediaThumbLoading"><Loader2 className="spin" size={18} aria-hidden="true" /><span>{candidates.length ? "Régénération…" : "Extraction des images…"}</span></div> : null}
      {extractHint ? <p className="mediaEditorMessage isError" role="alert"><AlertCircle size={18} aria-hidden="true" />{extractHint}</p> : null}

      {!isEditing && sourceMode === "file" && files.length > 0 && !candidates.length && !extracting ? (
        <button className="secondaryButton" type="button" onClick={() => startFileExtraction(files)}><ImageIcon size={16} aria-hidden="true" />Générer les miniatures</button>
      ) : null}
      {isEditing && decision?.mode === "direct_play" ? (
        <button className="secondaryButton" type="button" onClick={() => void extractFromCurrentMedia()} disabled={extracting || busy}><RefreshCw className={extracting ? "spin" : undefined} size={16} aria-hidden="true" />{candidates.length ? "Régénérer les miniatures" : "Générer les miniatures"}</button>
      ) : null}
      {isEditing && decision?.mode === "hls" ? <small className="mediaThumbHint">La génération est indisponible sur un flux HLS : utilisez l’upload manuel ci-dessous.</small> : null}

      {hasLandscapeThumb ? (
        <div className="mediaThumbGroup">
          <header><strong>Format horizontal</strong><small>16:9 · miniature des cartes et listes</small></header>
          <div className="mediaThumbCandidates" role="group" aria-label="Miniatures horizontales">
            {candidates.filter((candidate) => candidate.aspect === "landscape").map((candidate) => (
              <button key={candidate.id} type="button" className={`mediaThumbCandidate ${selectedCandidateId === candidate.id ? "is-active" : ""}`} onClick={() => pickCandidate(candidate)} disabled={busy || uploading !== null} aria-pressed={selectedCandidateId === candidate.id}>
                <img src={candidate.imageUrl} alt={`Miniature à ${candidate.timeLabel}`} />
                <span>{candidate.timeLabel}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {form.kind === "short" && hasPortraitThumb ? (
        <div className="mediaThumbGroup">
          <header><strong>Format vertical</strong><small>9:16 · aperçu du flux Flashy</small></header>
          <div className="mediaThumbCandidates" role="group" aria-label="Miniatures verticales">
            {candidates.filter((candidate) => candidate.aspect === "portrait").map((candidate) => (
              <button key={candidate.id} type="button" className={`mediaThumbCandidate isPortrait ${selectedCandidateId === candidate.id ? "is-active" : ""}`} onClick={() => pickCandidate(candidate)} disabled={busy || uploading !== null} aria-pressed={selectedCandidateId === candidate.id}>
                <img src={candidate.imageUrl} alt={`Miniature à ${candidate.timeLabel}`} />
                <span>{candidate.timeLabel}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  ) : null;

  const publishSection = (
    <section className="mediaPublishSection" aria-labelledby="media-publish-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-publish-title">{isEditing ? "Publication" : sourceStepShown ? "3) Publication" : "2) Publication"}</h3><p>Un brouillon reste visible uniquement dans Nino Studio. « Unlisted » est caché du catalogue mais lisible par lien direct.</p></div>
      <div className="mediaFieldGrid">
        <label><span>Visibilité</span><select value={form.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="draft">Brouillon</option><option value="private">Privé</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label>
        {!isShort ? <label><span>Publication programmée</span><input type="datetime-local" value={form.publishAt} onChange={(event) => update("publishAt", event.target.value)} /></label> : null}
        {isEditing && !isShort ? (
          <div className="isWide mediaPublishTools">
            <button type="button" className="studioSecondaryTool" onClick={restorePublishInfo} title="Réapplique la date et la visibilité enregistrées sur ce média."><RefreshCw size={16} aria-hidden="true" />Restaurer la date de publication</button>
            <small className="mediaPublishInfo">Valeur enregistrée : {media?.publish_at ? new Date(media.publish_at).toLocaleString("fr-FR") : "aucune"} · visibilité « {media ? VISIBILITY_LABELS[media.visibility] ?? media.visibility : ""} »</small>
          </div>
        ) : null}
        {isSeries || form.seriesId ? <label className="mediaCheckbox isWide" title="Masque les épisodes non sortis de cette série sur la page série (anti-spoiler).">
          <input type="checkbox" checked={form.noSpoil} onChange={(event) => update("noSpoil", event.target.checked)} />
          <span><strong>Mode No Spoil</strong><small>Masque les vidéos non sorties de la série.</small></span>
        </label> : null}
        {!isSeries ? <label className="mediaCheckbox isWide" title="Notifie le webhook Discord configuré (NINO_DISCORD_WEBHOOK_URL) à la sortie du contenu.">
          <input type="checkbox" checked={form.notifyDiscord} onChange={(event) => update("notifyDiscord", event.target.checked)} />
          <span><BellRing size={16} aria-hidden="true" /><strong>Notifier Discord à la sortie</strong></span>
        </label> : null}
        {!isSeries ? <label className="mediaCheckbox isWide"><input type="checkbox" checked={form.isAvailable} onChange={(event) => update("isAvailable", event.target.checked)} /><span>Autoriser la lecture dès que le contenu est publié</span></label> : null}
      </div>
    </section>
  );

  const feedback = (
    <>
      {error ? <div ref={feedbackRef} className="mediaEditorMessage isError" role="alert" tabIndex={-1}><AlertCircle size={18} />{error}</div> : null}
      {success ? <div className="mediaEditorMessage isSuccess" role="status"><CheckCircle2 size={18} />{success}</div> : null}
    </>
  );

  if (isPage && media) {
    const previewReady = Boolean(decision);
    const canOpenPublicPlayer = media.visibility === "public" && media.is_available && Boolean(media.source_kind);
    const saveStatus = busy ? "saving" : error ? "error" : dirty ? "dirty" : "saved";
    const saveStatusLabel: Record<string, string> = {
      saved: "Enregistré",
      dirty: "Modifications à enregistrer",
      saving: "Enregistrement…",
      error: "Erreur d’enregistrement"
    };
    return (
      <section className="mediaEditPage">
        <header className="mediaEditPageHeader">
          <div className="mediaEditPageTitle">
            <button className="studioIconButton" type="button" onClick={onCancel} aria-label="Retour à la liste des vidéos"><X size={20} /></button>
            <div>
              <h1>{media.title}</h1>
              <p>Modifiez la fiche, contrôlez le flux puis enregistrez.</p>
              <span className={`mediaEditSaveStatus is${saveStatus}`} role="status"><i aria-hidden="true" />{saveStatusLabel[saveStatus]}</span>
              <kbd className="mediaSaveShortcut" aria-hidden="true"><span>{isMac ? "⌘" : "Ctrl"}</span>+S</kbd>
            </div>
          </div>
          <div className="mediaEditPageActions">
            {canOpenPublicPlayer ? <Link className="secondaryButton" href={`/watch/${encodeURIComponent(media.id)}`} target="_blank"><Play size={18} aria-hidden="true" />Lire</Link> : null}
            <button className="secondaryButton" type="button" onClick={onRefresh} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : undefined} size={18} aria-hidden="true" />{refreshing ? "Actualisation…" : "Rafraîchir"}</button>
            <button className="dangerButton" type="button" onClick={() => setDeleteOpen(true)} disabled={busy} aria-haspopup="dialog"><Trash2 size={18} aria-hidden="true" />Supprimer</button>
            <button className="primaryButton mediaEditDesktopSave" type="submit" form="media-edit-form" disabled={busy} title={`Enregistrer (${isMac ? "⌘" : "Ctrl"} + S)`}>{busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}{busy ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </header>

        <form id="media-edit-form" ref={editorFormRef} className="mediaEditLayout" onSubmit={submit}>
          <aside className="mediaEditAside">
            <section className="mediaEditPreview" aria-labelledby="media-preview-title">
              <header><div><h2 id="media-preview-title">Aperçu</h2><p>{isSeries ? "Fiche de série" : form.kind === "short" ? "Format vertical Flashy" : "Format vidéo 16:9"}</p></div><span className={`studioStatus ${previewReady ? "isReady" : "isDraft"}`}>{isSeries ? "Pas de source" : previewReady ? "Lisible" : "Indisponible"}</span></header>
              <div className={form.kind === "short" ? "mediaEditPlayer isPortrait" : "mediaEditPlayer"}>
                {!isSeries && decision ? <MediaPlayer decision={decision} poster={media.backdrop_url ?? media.poster_url} /> : <div className="mediaEditPreviewEmpty"><VideoOff size={30} aria-hidden="true" /><strong>{isSeries ? "Conteneur de série" : "Aperçu indisponible"}</strong><p>{isSeries ? "Une série regroupe des saisons et des épisodes, elle n'a pas de source vidéo directe." : previewError ?? "Aucune source lisible n’est attachée à ce média."}</p></div>}
              </div>
            </section>

            <section className="mediaEditFiles" aria-labelledby="media-files-title">
              <header><h2 id="media-files-title">Fichiers</h2></header>
              <dl>
                <div><FileStack size={18} aria-hidden="true" /><dt>Source</dt><dd>{isSeries ? "Aucune" : media.source_kind === "hls" ? "Paquet HLS" : media.source_kind === "file" ? "Fichier vidéo" : "Inconnue"}</dd></div>
                {!isSeries ? <div><FileVideo2 size={18} aria-hidden="true" /><dt>Entrée</dt><dd>{media.source_filename ?? "Non renseignée"}</dd></div> : null}
                {!isSeries ? <div><HardDrive size={18} aria-hidden="true" /><dt>Taille</dt><dd>{formatBytes(media.file_size_bytes)}</dd></div> : null}
                {media.series_source_id ? <div><Layers3 size={18} aria-hidden="true" /><dt>Épisode</dt><dd>S{media.season_number ?? 1} · E{media.episode_number ?? "?"}</dd></div> : null}
                {media.source_origin === "luma_storage" ? <div><FolderOpen size={18} aria-hidden="true" /><dt>Origine</dt><dd>Stockage LUMA</dd></div> : null}
                {media.hls_variants?.length ? <div className="mediaHlsQualityRow"><Layers3 size={18} aria-hidden="true" /><dt>Qualités</dt><dd><ul className="mediaHlsVariants">{media.hls_variants.map((variant) => <li key={variant.path}>{variant.label}</li>)}</ul></dd></div> : null}
              </dl>
            </section>
          </aside>

          <div className="mediaEditMain">
            {contentSection}
            {publishSection}
            {form.kind === "movie" ? seriesSection : null}
            {visualSection}
            {thumbnailBlock}
            {!isSeries ? warningSection : null}
            {feedback}
          </div>

          <footer className="mediaEditActionBar">
            {success ? <span>{success}</span> : null}
            <div><button className="secondaryButton" type="button" onClick={onCancel} disabled={busy}>Retour au Studio</button><button className="primaryButton" type="submit" disabled={busy} title={`Enregistrer (${isMac ? "⌘" : "Ctrl"} + S)`}>{busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
          </footer>
        </form>

        {deleteOpen && media ? (
          <div className="studioDeleteBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteModal(); }}>
            <div className="studioDeleteDialog" role="dialog" aria-modal="true" aria-labelledby="studio-delete-title" aria-describedby="studio-delete-copy" ref={deleteDialogRef}>
              <header className="studioDialogHeader">
                <span className="studioDialogIcon" aria-hidden="true"><TriangleAlert size={22} /></span>
                <div>
                  <h2 id="studio-delete-title">Supprimer « {media.title} » ?</h2>
                  <p id="studio-delete-copy">Le contenu et sa source disparaissent durablement des fichiers de Nino.</p>
                </div>
                <button className="studioIconButton" type="button" onClick={closeDeleteModal} aria-label="Fermer la fenêtre"><X size={18} /></button>
              </header>
              <div className="studioDialogBody">
                <p>Hésitez ? Mettez le contenu en privé : il n’apparaîtra plus dans le catalogue, mais restera modifiable dans Nino Studio.</p>
                <p className="studioDeleteCost" role="note"><HardDrive size={17} aria-hidden="true" />{media.file_size_bytes != null ? `Vous perdrez ${formatBytes(media.file_size_bytes)} de fichiers source.` : "Vous perdrez l’intégralité des fichiers source."}<strong>Cette action est irréversible.</strong></p>
                {isSeries ? <p className="studioDeleteNote">Tous les épisodes rattachés à cette série seront également supprimés.</p> : null}
                {deleteError ? <p className="mediaEditorMessage isError" role="alert"><AlertCircle size={18} aria-hidden="true" />{deleteError}</p> : null}
              </div>
              <div className="studioDialogActions">
                <button className="secondaryButton" type="button" onClick={closeDeleteModal} disabled={deleteBusy}>Annuler</button>
                <button className="secondaryButton" type="button" onClick={() => void makePrivate()} disabled={deleteBusy}><Lock size={16} aria-hidden="true" />Mettre en privé</button>
                <button className="dangerButton" type="button" onClick={() => void confirmDelete()} disabled={deleteBusy} aria-label={deleteBusy ? "Suppression en cours" : undefined}>{deleteBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}{deleteBusy ? "Suppression…" : "Supprimer définitivement"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form ref={editorFormRef} className="mediaEditor v7Upload" onSubmit={submit}>
      <header className="mediaEditorHeader v7UploadHeader">
        <div><span>Nino Studio</span><h2>{isSeries ? "Nouvelle série" : kind === "short" ? "Upload Flashy" : "Upload vidéo"}</h2><p>{isSeries ? "Créez un conteneur de série, puis rattachez-y des épisodes." : "Déposez votre fichier, vérifiez les informations puis envoyez-le. Le traitement démarre ensuite côté backend."}</p></div>
        <div className="v7UploadHeaderActions">
          <button className="studioIconButton" type="button" onClick={onCancel} aria-label="Fermer l’éditeur"><X size={19} /></button>
          <button className="primaryButton" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : isSeries ? <Tags size={18} /> : <Upload size={18} />}{busy ? "Enregistrement…" : isSeries ? "Créer la série" : "Importer le média"}</button>
        </div>
      </header>
      <div className="v7UploadGrid">
        {sourceSection}
        {contentSection}
        {form.kind === "movie" ? seriesSection : null}
        <div className="v7UploadSettings">{publishSection}{visualSection}{thumbnailBlock}{!isSeries ? warningSection : null}</div>
        {!isSeries && files.length ? <section className="v7UploadPreview" aria-labelledby="upload-preview-title"><div className="mediaEditorSectionTitle"><h3 id="upload-preview-title">Aperçu rapide</h3><p>Le détail technique sera enrichi après le traitement.</p></div><dl><div><dt>Fichier</dt><dd>{sourceMode === "hls" ? `${files.length} éléments HLS` : files[0]?.name}</dd></div><div><dt>Taille</dt><dd>{formatBytes(packageInfo.bytes)}</dd></div><div><dt>Source</dt><dd>{sourceMode === "hls" ? "HLS multi-qualités" : files[0]?.type || "Vidéo"}</dd></div><div><dt>Statut</dt><dd>Prêt à envoyer</dd></div></dl></section> : null}
      </div>
      {feedback}
      {busy ? <UploadProgressIndicator uploadProgress={uploadProgress} /> : null}
      <footer className="mediaEditorFooter"><button className="secondaryButton" type="button" onClick={onCancel} disabled={busy}>Annuler</button><button className="primaryButton" type="submit" disabled={busy} title={`Enregistrer (${isMac ? "⌘" : "Ctrl"} + S)`}>{busy ? <Loader2 className="spin" size={18} /> : isSeries ? <Tags size={18} /> : <Upload size={18} />}{busy ? "Enregistrement…" : isSeries ? "Créer la série" : "Importer le média"}</button></footer>
    </form>
  );
}
