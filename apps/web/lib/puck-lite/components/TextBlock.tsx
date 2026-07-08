import * as React from 'react';

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes dangerous tags and attributes while keeping safe HTML
 */
function sanitizeHtml(html: string): string {
  // Remove script, iframe, object, embed, form, input, textarea, select tags
  let sanitized = html.replace(/<(script|iframe|object|embed|form|input|textarea|select|link|style|meta)[^>]*>.*?<\/\1>/gis, '');
  sanitized = sanitized.replace(/<(script|iframe|object|embed|form|input|textarea|select|link|style|meta)[^>]*\/?>/gi, '');
  
  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: protocol (except safe images)
  sanitized = sanitized.replace(/data\s*:(?!image\/(?:png|jpg|jpeg|gif|svg\+xml))/gi, '');
  
  return sanitized;
}

export default function TextBlock({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />;
}
