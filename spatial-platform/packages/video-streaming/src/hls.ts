import { ADAPTIVE_PROFILES, type TranscodeProfile } from './encode'

export interface HLSManifest {
  version: number
  profiles: TranscodeProfile[]
  masterPlaylistUrl: string
  baseUrl: string
}

export function generateMasterPlaylist(baseUrl: string, profiles?: TranscodeProfile[]): string {
  const profs = profiles ?? ADAPTIVE_PROFILES
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
  ]

  for (const profile of profs) {
    const [width, height] = profile.resolution
    lines.push('#EXT-X-STREAM-INF:')
    lines.push(`BANDWIDTH=${profile.bitrate},RESOLUTION=${width}x${height},CODECS="${profile.codec}"`)
    lines.push(`${baseUrl}/${profile.name}/index.m3u8`)
  }

  return lines.join('\n')
}

export function generateMediaPlaylist(
  segments: { url: string; duration: number }[],
  targetDuration = 6,
  sequenceNumber = 0
): string {
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    `#EXT-X-TARGETDURATION:${targetDuration}`,
    `#EXT-X-MEDIA-SEQUENCE:${sequenceNumber}`,
  ]

  for (const seg of segments) {
    lines.push(`#EXTINF:${seg.duration.toFixed(3)},`)
    lines.push(seg.url)
  }

  lines.push('#EXT-X-ENDLIST')
  return lines.join('\n')
}

export function parseSegmentDuration(filename: string): number {
  const match = filename.match(/seg-(\d+)-(\d+(?:\.\d+)?)\.ts/)
  if (match) {
    return parseFloat(match[2])
  }
  return 6
}

export function getHlsUrl(baseUrl: string, videoId: string): string {
  return `${baseUrl}/api/video/${videoId}/hls/master.m3u8`
}
