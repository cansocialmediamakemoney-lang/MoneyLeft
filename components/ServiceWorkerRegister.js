"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production (avoids cache headaches during development)
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // If a new service worker is waiting, prompt it to activate
        if (reg.waiting) reg.waiting.postMessage("skipWaiting");

        // Listen for updates and prompt the new SW to take over
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("skipWaiting");
            }
          });
        });
      } catch (err) {
        console.warn("Service worker registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}