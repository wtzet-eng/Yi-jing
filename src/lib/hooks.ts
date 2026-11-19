import { useState, useEffect, useCallback } from "react";

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("iching_dark_mode");
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("iching_dark_mode", JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // ignore
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return { darkMode, toggleDarkMode };
}

export function useServiceWorker() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const checkReady = () => {
      const worker = navigator.serviceWorker.controller;
      if (!worker) return;
      const channel = new MessageChannel();
      const timer = window.setTimeout(() => channel.port1.close(), 5000);
      channel.port1.onmessage = event => {
        clearTimeout(timer);
        channel.port1.close();
        if (!disposed) {
          setOfflineReady(event.data?.ready === true);
          setOfflineError(event.data?.ready !== true);
        }
      };
      worker.postMessage({ type: "OFFLINE_STATUS" }, [channel.port2]);
    };
    const checkUpdate = () => {
      checkReady();
      registration?.update().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("controllerchange", checkReady);
    window.addEventListener("online", checkUpdate);
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(reg => {
      if (disposed) return;
      registration = reg;
      if (reg.waiting) setUpdate(reg.waiting);
      const observe = () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (disposed) return;
          if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdate(reg.waiting);
          if (worker.state === "activated") checkReady();
          if (worker.state === "redundant") setOfflineError(true);
        });
      };
      reg.addEventListener("updatefound", observe);
      observe();
      checkUpdate();
    }).catch(() => { if (!disposed) setOfflineError(true); });
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", checkReady);
      window.removeEventListener("online", checkUpdate);
    };
  }, []);

  const applyUpdate = () => {
    if (!update) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    update.postMessage({ type: "SKIP_WAITING" });
  };
  return { offlineReady, offlineError, updateAvailable: Boolean(update), applyUpdate };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
