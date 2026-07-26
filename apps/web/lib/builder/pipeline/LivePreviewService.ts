import { getEventBus } from './EventBus';
import { EventNames, type PreviewUpdatedPayload } from './types';
import { logger } from '@/lib/logger';

export class LivePreviewService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private iframe: HTMLIFrameElement | null = null;
  private lastPreview: PreviewUpdatedPayload | null = null;
  private updateCount = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.PREVIEW_UPDATED, (event) => {
        const payload = event.payload;
        this.lastPreview = payload;
        this.updateCount++;
        this.scheduleRender();
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.PREVIEW_RELOAD, (event) => {
        const { full } = event.payload;
        if (full) {
          this.renderPreview();
        } else {
          this.scheduleRender();
        }
      })
    );
  }

  setIframe(iframe: HTMLIFrameElement | null): void {
    this.iframe = iframe;
    if (iframe && this.lastPreview) {
      this.renderPreview();
    }
  }

  private scheduleRender(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.renderPreview();
    }, 100);
  }

  private renderPreview(): void {
    if (!this.iframe?.contentDocument || !this.lastPreview) return;
    try {
      const doc = this.iframe.contentDocument;
      doc.open();
      doc.write(this.lastPreview.html);
      doc.close();
    } catch (err) {
      logger.warn('[LivePreview] Render failed:', err);
    }
  }

  getLastPreview(): PreviewUpdatedPayload | null { return this.lastPreview; }
  getUpdateCount(): number { return this.updateCount; }

  stop(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.iframe = null;
  }
}

export const livePreviewService = new LivePreviewService();
