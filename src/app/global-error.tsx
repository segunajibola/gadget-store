"use client";

/**
 * Last-resort error page if even the root layout fails. It replaces the
 * whole document, so it must render its own <html> and <body> and can't rely
 * on our CSS — hence inline styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-NG">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "80px 16px", color: "#0f172a" }}>
        <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
        <p style={{ color: "#334155" }}>Please refresh the page. If it keeps happening, contact us on WhatsApp.</p>
        <button
          onClick={reset}
          style={{ marginTop: 16, padding: "10px 20px", background: "#0270d6", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
