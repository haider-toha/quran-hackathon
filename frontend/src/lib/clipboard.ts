// Async copy-to-clipboard with a fallback for non-secure contexts (file://,
// http:// dev pages without HTTPS, sandboxed iframes). Returns true if the
// write succeeded; callers fire user feedback (toast) on the boolean.
//
// Why a fallback: `navigator.clipboard.writeText` is undefined when the page
// is served outside a secure context, and Safari's permissions model can
// reject it even on https when the call is detached from a user gesture.
// The textarea+execCommand path keeps us functional in those edge cases.
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (text.length === 0) return false;

  if (window.navigator.clipboard?.writeText) {
    try {
      await window.navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
