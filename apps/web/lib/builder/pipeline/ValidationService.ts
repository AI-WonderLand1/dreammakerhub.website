import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type ValidationIssue, type ValidationCompletedPayload } from './types';
import { useBuilderStore } from '../store';
import { extractHeadings, checkHeadingHierarchy, checkFormLabels, getContrastRatio, getContrastGrade } from '../a11y-utils';
import { logger } from '@/lib/logger';

export class ValidationService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private lastIssues: ValidationIssue[] = [];

  start(): void {
    // Validate whenever state changes
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, (event) => {
        this.runValidation();
      })
    );

    // Also validate on specific element events
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_ADDED, () => this.runValidation())
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, () => this.runValidation())
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_UPDATED, () => this.runValidation())
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_STYLES_CHANGED, () => this.runValidation())
    );
  }

  private async runValidation(): Promise<void> {
    const elements = useBuilderStore.getState().elements;
    const startTime = performance.now();

    this.bus.emit(EventNames.VALIDATION_STARTED, {
      files: ['builder-state.json', 'index.html', 'styles.css'],
    });

    const issues: ValidationIssue[] = [];

    // 1. Check heading hierarchy
    const headings = extractHeadings(elements);
    const headingIssues = checkHeadingHierarchy(headings);
    for (const hi of headingIssues) {
      issues.push({
        id: `heading-${hi.id}`,
        severity: hi.severity,
        message: hi.message,
        file: 'builder-state.json',
      });
    }

    // 2. Check for missing alt text
    const walkForAlt = (els: any[]): void => {
      for (const el of els) {
        if ((el.type === 'image' || el.type === 'avatar') && !el.props?.alt) {
          issues.push({
            id: `alt-${el.id}`,
            severity: 'error',
            message: `Missing alt text on ${el.name}. Screen readers cannot describe this image.`,
            file: 'builder-state.json',
          });
        }
        if (el.children) walkForAlt(el.children);
      }
    };
    walkForAlt(elements);

    // 3. Check form labels
    const formIssues = checkFormLabels(elements);
    for (const fi of formIssues) {
      if (!fi.hasLabel) {
        issues.push({
          id: `label-${fi.id}`,
          severity: 'error',
          message: `Missing label on ${fi.name} (${fi.type}) form field.`,
          file: 'builder-state.json',
        });
      }
    }

    // 4. Check color contrast
    const walkForContrast = (els: any[]): void => {
      for (const el of els) {
        const s = el.styles;
        if (s?.color && s?.backgroundColor) {
          try {
            const ratio = getContrastRatio(s.color, s.backgroundColor);
            const grade = getContrastGrade(ratio);
            if (grade === 'fail') {
              issues.push({
                id: `contrast-${el.id}`,
                severity: 'error',
                message: `Low color contrast (${ratio.toFixed(1)}:1) on ${el.name}. Minimum 4.5:1 required.`,
                file: 'styles.css',
              });
            }
          } catch {}
        }
        if (el.children) walkForContrast(el.children);
      }
    };
    walkForContrast(elements);

    // 5. Check for duplicate IDs
    const ids = new Set<string>();
    const walkForIds = (els: any[]): void => {
      for (const el of els) {
        if (ids.has(el.id)) {
          issues.push({
            id: `duplicate-id-${el.id}`,
            severity: 'error',
            message: `Duplicate element ID: ${el.id.slice(0, 12)}. IDs must be unique.`,
            file: 'builder-state.json',
          });
        }
        ids.add(el.id);
        if (el.children) walkForIds(el.children);
      }
    };
    walkForIds(elements);

    // 6. Check for invalid element types
    const validTypes = new Set([
      'heading', 'paragraph', 'rich-text', 'list', 'quote', 'code', 'verse', 'typewriter', 'badge',
      'icon-list', 'animated-text', 'icon', 'image', 'gallery', 'video', 'cover', 'media-text',
      'audio', 'file', 'lottie', 'svg', 'image-hotspot', 'avatar', 'ai-image', 'ai-tts',
      'button', 'buttons', 'input', 'textarea', 'select', 'checkbox', 'radio', 'toggle', 'rating',
      'file-upload', 'contact-form', 'newsletter', 'search', 'wp-search', 'form-webhook', 'ai-form',
      'wp-menu', 'wp-breadcrumbs', 'pagination', 'tags', 'back-to-top', 'social-share', 'hashtag',
      'hero', 'testimonial', 'pricing', 'team-grid', 'logo-cloud', 'cta', 'count-up', 'progress',
      'alert', 'chart', 'ai-seo', 'ai-recommend', 'wp-post', 'wp-page', 'wp-comments', 'wp-login',
      'wp-profile', 'wp-sidebar', 'wp-widget', 'author-box', 'comment', 'steps', 'faq',
      'product-card', 'product-grid', 'add-to-cart', 'price', 'quantity', 'cart-icon', 'checkout',
      'reviews', 'categories', 'shipping', 'accordion', 'tabs', 'table', 'spacer', 'divider',
      'card', 'modal', 'map', 'embed', 'codepen', 'tweet', 'instagram', 'tiktok', 'gist',
      'custom-html', 'custom-css', 'custom-js', 'shortcode', 'php', 'conditional',
      'webhook-trigger', 'api-response', 'zapier', 'n8n', 'make', 'rest-api', 'graphql',
      'sse-stream', 'websocket', 'ai-text', 'ai-chat', 'ai-translate', 'ai-summarize', 'ai-code',
      'ai-rewrite', 'ai-extract', 'columns', 'row', 'group', 'section', 'container', 'grid', 'flex',
      'skip-to-content',
    ]);
    for (const el of elements) {
      if (!validTypes.has(el.type)) {
        issues.push({
          id: `unknown-type-${el.id}`,
          severity: 'warning',
          message: `Unknown element type "${el.type}" on "${el.name}". This may not render correctly.`,
        });
      }
    }

    const duration = performance.now() - startTime;
    const passed = issues.filter((i) => i.severity === 'error').length === 0;

    this.lastIssues = issues;

    const result: ValidationCompletedPayload = { passed, issues, duration };
    this.bus.emit(EventNames.VALIDATION_COMPLETED, result);

    if (!passed) {
      for (const issue of issues) {
        this.bus.emit(EventNames.VALIDATION_ISSUE, issue);
      }
      logger.warn(`[Validation] Failed with ${issues.filter((i) => i.severity === 'error').length} errors, ${issues.filter((i) => i.severity === 'warning').length} warnings`);
    } else {
      logger.info(`[Validation] Passed (${duration.toFixed(0)}ms)`);
    }
  }

  getLastIssues(): ValidationIssue[] {
    return [...this.lastIssues];
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const validationService = new ValidationService();
