/**
 * Minimal HTML sanitizer for client-side rendering of adapter-provided notes.
 *
 * - Strips <script>/<style> blocks and closing tags
 * - Removes inline event handlers (on*)
 * - Neutralizes javascript: URLs in href/src
 * - Whitelists a small set of tags: a,b,strong,i,em,code,br,ul,ol,li,p
 *
 * This utility is intentionally small and dependency-free. If we decide to
 * allow richer HTML, we can swap this implementation with a vetted library
 * (e.g., DOMPurify) behind the same function signature.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script/style elements entirely (including contents)
  let out = html
    .replace(/<\/(?:script|style)>/gi, '')
    .replace(/<(?:script|style)[\s\S]*?>[\s\S]*?<\/(?:script|style)>/gi, '');

  // Remove inline event handlers like onload=, onclick=
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');

  // Neutralize javascript: protocol in href/src
  out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, '$1="#"');

  // Strip non-whitelisted tags (keep: a,b,strong,i,em,code,br,ul,ol,li,p)
  out = out.replace(/<(?!\/?(?:a|b|strong|i|em|code|br|ul|ol|li|p)\b)[^>]*>/gi, '');

  return out;
}
