import type { VideoUpload } from '@spatial/core'

export interface UploadConfig {
  apiBase: string
  token: string
  chunkSize?: number
}

export class VideoUploader {
  private config: UploadConfig

  constructor(config: UploadConfig) {
    this.config = config
  }

  async upload(file: File, onProgress?: (percent: number) => void): Promise<VideoUpload> {
    const chunkSize = this.config.chunkSize ?? 5 * 1024 * 1024
    const totalChunks = Math.ceil(file.size / chunkSize)

    if (file.size <= chunkSize) {
      return this.uploadSingle(file)
    }

    return this.uploadChunked(file, totalChunks, chunkSize, onProgress)
  }

  private async uploadSingle(file: File): Promise<VideoUpload> {
    const form = new FormData()
    form.append('file', file)
    form.append('title', file.name)

    const res = await fetch(`${this.config.apiBase}/api/video/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config.token}` },
      body: form,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
    return res.json()
  }

  private async uploadChunked(
    file: File,
    totalChunks: number,
    chunkSize: number,
    onProgress?: (percent: number) => void
  ): Promise<VideoUpload> {
    const uploadId = crypto.randomUUID()
    let uploadedChunks = 0

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const form = new FormData()
      form.append('chunk', chunk)
      form.append('uploadId', uploadId)
      form.append('chunkIndex', String(i))
      form.append('totalChunks', String(totalChunks))
      form.append('filename', file.name)

      const res = await fetch(`${this.config.apiBase}/api/video/upload/chunk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.config.token}` },
        body: form,
      })
      if (!res.ok) throw new Error(`Chunk ${i} upload failed: ${res.statusText}`)

      uploadedChunks++
      if (onProgress) {
        onProgress(Math.round((uploadedChunks / totalChunks) * 100))
      }
    }

    const res = await fetch(`${this.config.apiBase}/api/video/upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({ uploadId, filename: file.name }),
    })
    if (!res.ok) throw new Error(`Upload completion failed: ${res.statusText}`)
    return res.json()
  }

  async getUploadStatus(id: string): Promise<VideoUpload> {
    const res = await fetch(`${this.config.apiBase}/api/video/${id}`, {
      headers: { 'Authorization': `Bearer ${this.config.token}` },
    })
    if (!res.ok) throw new Error(`Failed to get upload status: ${res.statusText}`)
    return res.json()
  }

  async listMyVideos(): Promise<VideoUpload[]> {
    const res = await fetch(`${this.config.apiBase}/api/video/mine`, {
      headers: { 'Authorization': `Bearer ${this.config.token}` },
    })
    if (!res.ok) throw new Error(`Failed to list videos: ${res.statusText}`)
    return res.json()
  }

  async deleteVideo(id: string): Promise<void> {
    const res = await fetch(`${this.config.apiBase}/api/video/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.config.token}` },
    })
    if (!res.ok) throw new Error(`Failed to delete video: ${res.statusText}`)
  }
}
