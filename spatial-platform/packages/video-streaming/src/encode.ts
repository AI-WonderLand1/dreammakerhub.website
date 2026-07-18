export type EncodePreset = 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow'
export type Resolution = '480p' | '720p' | '1080p' | '4k'
export type Codec = 'h264' | 'h265' | 'vp9' | 'av1'

export interface EncodeJob {
  id: string
  inputPath: string
  outputPath: string
  preset: EncodePreset
  resolution: Resolution
  codec: Codec
  bitrate: number
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  error: string | null
}

export interface TranscodeProfile {
  name: string
  resolution: [number, number]
  bitrate: number
  codec: Codec
}

export const ADAPTIVE_PROFILES: TranscodeProfile[] = [
  { name: '480p', resolution: [854, 480], bitrate: 1_500_000, codec: 'h264' },
  { name: '720p', resolution: [1280, 720], bitrate: 3_000_000, codec: 'h264' },
  { name: '1080p', resolution: [1920, 1080], bitrate: 6_000_000, codec: 'h264' },
]

export function createEncodeJob(
  inputPath: string,
  outputPath: string,
  options?: Partial<{
    preset: EncodePreset
    resolution: Resolution
    codec: Codec
    bitrate: number
  }>
): EncodeJob {
  return {
    id: crypto.randomUUID(),
    inputPath,
    outputPath,
    preset: options?.preset ?? 'medium',
    resolution: options?.resolution ?? '1080p',
    codec: options?.codec ?? 'h264',
    bitrate: options?.bitrate ?? 6_000_000,
    status: 'queued',
    progress: 0,
    error: null,
  }
}

export function getFFmpegArgs(job: EncodeJob): string[] {
  const resolutionMap: Record<Resolution, string> = {
    '480p': '854x480',
    '720p': '1280x720',
    '1080p': '1920x1080',
    '4k': '3840x2160',
  }

  return [
    '-i', job.inputPath,
    '-c:v', job.codec,
    '-preset', job.preset,
    '-b:v', String(job.bitrate),
    '-vf', `scale=${resolutionMap[job.resolution]}`,
    '-movflags', '+faststart',
    '-y', job.outputPath,
  ]
}
