"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "ml-install-dismissed";
const DISMISS_DAYS = 14;

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If already running as installed app, never show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) { setDismissed(true); return; }

    // Check if dismissed recently
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) {
        const d = parseInt(raw);
        if (Date.now() - d < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
          setDismissed(true); return;
        }
      }
    } catch {}

    setDismissed(false);

    // Android / Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS — detect Safari on iPhone/iPad
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos && isSafari) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismiss();
      setInstallEvent(null);
    }
  };

  if (dismissed) return null;
  if (!installEvent && !showIosHint) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-40 bg-white rounded-2xl shadow-2xl border-2 border-emerald-100 p-4 max-w-md mx-auto"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">📱</div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-stone-800 mb-1">Add MoneyLeft to your phone</p>

          {installEvent ? (
            <p className="text-stone-600 text-base mb-3">
              Get a real app icon on your home screen — opens full-screen, just like a real app.
            </p>
          ) : showIosHint ? (
            <p className="text-stone-600 text-base mb-3">
              Tap the Share button <span className="inline-block px-2 bg-stone-100 rounded">⎙</span> at the bottom of Safari, then choose <strong>"Add to Home Screen"</strong>.
            </p>
          ) : null}

          <div className="flex gap-2">
            {installEvent && (
              <button
                onClick={install}
                className="flex-1 py-2 px-4 rounded-xl font-bold text-white text-base"
                style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }}
              >
                Install
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-4 py-2 rounded-xl font-semibold text-stone-500 text-base border-2 border-stone-200"
            >
              {installEvent ? "Not Now" : "Got It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}