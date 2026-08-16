export type ParsedFilename = {
  title: string;
  year: number | null;
  season: number | null;
  episode: number | null;
};

export type FrameAspect = "landscape" | "portrait";

export type VideoFrameCandidate = {
  id: string;
  aspect: FrameAspect;
  imageUrl: string;
  file: File;
  timeLabel: string;
};

const SCENE_TOKENS = new Set([
  "1080p",
  "720p",
  "480p",
  "360p",
  "2160p",
  "4k",
  "uhd",
  "hdr",
  "dv",
  "hdtv",
  "bluray",
  "web-dl",
  "webdl",
  "webrip",
  "remux",
  "hevc",
  "h265",
  "x265",
  "h264",
  "x264",
  "h.264",
  "avc",
  "multi",
  "proper",
  "repack",
  "remastered",
  "extended",
  "uncut",
  "internal",
  "amzn",
  "nf",
  "hulu",
  "stream"
]);

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export function parseVideoFilename(raw: string): ParsedFilename {
  let name = stripExtension(raw);

  let year: number | null = null;
  const yearMatch = name.match(/(?:^|[\s._(\[])(1[89]\d{2}|20\d{2})(?=$|[\s._)\]])/);
  if (yearMatch) {
    year = Number(yearMatch[1]);
    name = name.replace(yearMatch[0], " ");
  }

  let season: number | null = null;
  let episode: number | null = null;
  const seriesMatch = name.match(/[sS]([0-9]{1,2})\s*[eExX]\s*([0-9]{1,3})/);
  if (seriesMatch) {
    season = Number(seriesMatch[1]);
    episode = Number(seriesMatch[2]);
    name = name.replace(seriesMatch[0], " ");
  } else {
    const episodeMatch = name.match(/[eE]([0-9]{1,3})(?!\d)/);
    if (episodeMatch) {
      episode = Number(episodeMatch[1]);
      name = name.replace(episodeMatch[0], " ");
    }
  }

  name = name.replace(/\[[^\]]*\]/g, " ");
  const parts = name.split(/[\s._\-]+/).filter((part) => {
    const lower = part.toLowerCase();
    if (SCENE_TOKENS.has(lower)) return false;
    if (/^\d{3,4}p$/.test(lower)) return false;
    return part.length > 0;
  });

  let title = parts.join(" ").replace(/\s+/g, " ").replace(/^[,;:._\- ]+|[,;:._\- ]+$/g, "").trim();
  if (title.length > 1) title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, year, season, episode };
}

const LOAD_TIMEOUT_MS = 30_000;
const SEEK_TIMEOUT_MS = 8_000;

function releaseVideo(video: HTMLVideoElement) {
  video.removeAttribute("src");
  video.load();
}

export async function loadVideoElement(source: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    if (/^https?:/i.test(source)) video.crossOrigin = "anonymous";

    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      releaseVideo(video);
      reject(new Error("La vidéo ne peut pas être lue sur cet appareil."));
    };
    const ready = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(video);
    };
    const timer = window.setTimeout(fallback, LOAD_TIMEOUT_MS);
    video.addEventListener("loadedmetadata", ready, { once: true });
    video.addEventListener("error", fallback, { once: true });
    video.src = source;
    video.load();
  });
}

export async function readVideoDuration(source: string): Promise<number> {
  const video = await loadVideoElement(source);
  const duration = video.duration;
  releaseVideo(video);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("La durée n’est pas lisible pour ce fichier.");
  }
  return duration;
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("error", onError);
      if (ok) resolve();
      else reject(new Error("Capture d’image impossible à cette position."));
    };
    const onSeeked = () => finish(true);
    const onTimeUpdate = () => {
      if (!video.seeking && Math.abs(video.currentTime - time) <= 0.35) finish(true);
    };
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("error", onError);
    video.currentTime = Math.max(0, Math.min(time, video.duration > 0 ? video.duration - 0.05 : time));
  });
}

function waitForPaintedFrame(video: HTMLVideoElement): Promise<void> {
  const withCallback = (video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number })?.requestVideoFrameCallback;
  if (typeof withCallback === "function") {
    return new Promise((resolve) => withCallback.call(video, () => resolve()));
  }
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const TARGETS: Record<FrameAspect, { width: number; height: number }> = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 540, height: 960 }
};

function drawCoverFrame(video: HTMLVideoElement, aspect: FrameAspect): Promise<{ imageUrl: string; file: File }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const { width, height } = TARGETS[aspect];
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) {
      rejectPromise(new Error("Les dimensions de la vidéo sont inconnues."));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      rejectPromise(new Error("Le rendu des miniatures est indisponible."));
      return;
    }
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const srcWidth = width / scale;
    const srcHeight = height / scale;
    const srcX = (sourceWidth - srcWidth) / 2;
    const srcY = (sourceHeight - srcHeight) / 2;
    context.drawImage(video, srcX, srcY, srcWidth, srcHeight, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        rejectPromise(new Error("L’encodage de l’image a échoué."));
        return;
      }
      const suffix = aspect === "portrait" ? "verticale" : "miniature";
      const file = new File([blob], `${suffix}-${Date.now()}.jpg`, { type: "image/jpeg" });
      resolvePromise({ imageUrl: canvas.toDataURL("image/jpeg", 0.85), file });
    }, "image/jpeg", 0.85);
  });
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const FRAME_STOPS = [0.07, 0.22, 0.38, 0.54, 0.7, 0.86];

export async function extractVideoCandidates(source: string, aspects: FrameAspect[]): Promise<VideoFrameCandidate[]> {
  const video = await loadVideoElement(source);
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    releaseVideo(video);
    throw new Error("La durée de la vidéo est introuvable.");
  }

  const candidates: VideoFrameCandidate[] = [];
  try {
    for (const aspect of aspects) {
      for (let index = 0; index < FRAME_STOPS.length; index += 1) {
        const time = Math.max(0.05, duration * FRAME_STOPS[index]);
        await seekVideo(video, time);
        await waitForPaintedFrame(video);
        const { imageUrl, file } = await drawCoverFrame(video, aspect);
        candidates.push({
          id: `${aspect}-${index}`,
          aspect,
          imageUrl,
          file,
          timeLabel: formatTime(time)
        });
      }
    }
  } finally {
    releaseVideo(video);
  }
  return candidates;
}