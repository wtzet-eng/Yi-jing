import { useEffect, useState } from "react";
import { Download, Share2, X, Monitor, Check } from "lucide-react";

declare global {
  interface Window {
    __installPrompt?: unknown;
  }
}

interface Props {
  darkMode: boolean;
}

function DesktopInstructions({ darkMode, onClose }: Props & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-base">Install App on Desktop</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200/20 text-gray-400 hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          In Chrome or Edge, install Yijing from the browser menu. In Safari on Mac, use File → Add to Dock. Firefox on Linux may not offer app installation; you can still use the website offline once it has finished saving.
        </p>
        <ol className="space-y-3.5 text-sm">
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-700 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              1
            </span>
            <span>
              Look for the <strong>Install icon</strong> (a computer or down arrow inside a circle) in your browser’s address bar on the right.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-700 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              2
            </span>
            <span>
              Alternatively, open the browser menu (<strong>⋮</strong> or <strong>⋯</strong>) and click <strong>"Install Synchronicity Awareness Practice..."</strong> or <strong>"Cast, save and share" &rarr; "Install page as app"</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-700 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              3
            </span>
            <span>
              Click <strong>"Install"</strong> to add it to your desktop / applications then wait for “Ready for offline use” before disconnecting.
            </span>
          </li>
        </ol>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function AndroidInstructions({ darkMode, onClose }: Props & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-t-2xl p-6 pb-10 shadow-2xl ${
          darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-base">Download / Install App</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200/20">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              1
            </span>
            <span>
              Open the <strong>browser menu</strong> (three dots ⋮) at the top of your browser.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              2
            </span>
            <span>
              Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              3
            </span>
            <span>
              Confirm by tapping <strong>"Install"</strong> and wait for “Ready for offline use” before disconnecting.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function IosInstructions({ darkMode, onClose }: Props & { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-t-2xl p-6 pb-10 shadow-2xl ${
          darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-base">Download / Install on iOS</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200/20">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              1
            </span>
            <span>
              Tap the <strong>Share</strong> button{" "}
              <Share2 className="inline w-4 h-4 mb-0.5" /> at the bottom of Safari.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              2
            </span>
            <span>
              Scroll down and tap <strong>"Add to Home Screen"</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                darkMode ? "bg-gray-600 text-amber-400" : "bg-gray-100 text-amber-600"
              }`}
            >
              3
            </span>
            <span>
              Tap <strong>"Add"</strong> in the top right corner. Open the app while online and wait for “Ready for offline use”.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function InstallButton({ darkMode }: Props) {
  const [installPrompt, setInstallPrompt] = useState<unknown>(null);
  const [installed, setInstalled] = useState(false);
  const [modalType, setModalType] = useState<"ios" | "android" | "desktop" | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) {
      setInstalled(true);
      return;
    }
    if (window.__installPrompt) setInstallPrompt(window.__installPrompt);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      window.__installPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => {
      setInstalled(true);
      window.__installPrompt = null;
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  const handleClick = async () => {
    if (installPrompt) {
      try {
        const evt = installPrompt as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: string }>;
        };
        await evt.prompt();
        const { outcome } = await evt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setInstallPrompt(null);
        window.__installPrompt = null;
      } catch (err) {
        console.warn("Install prompt failed:", err);
      }
    } else {
      if (isIos) setModalType("ios");
      else if (isAndroid) setModalType("android");
      else setModalType("desktop");
    }
  };

  if (installed) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
        darkMode ? "bg-gray-800 text-green-400 border border-gray-700" : "bg-green-50 text-green-700 border border-green-200"
      }`}>
        <Check className="w-3.5 h-3.5" /> Installed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Download / install this app for offline use on phone or desktop"
        className={`flex items-center gap-2 text-xs px-4 py-1.5 rounded-full font-medium transition-all shadow-md ${
          darkMode
            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 shadow-amber-950/30"
            : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-amber-600/20"
        }`}
      >
        <Download className="w-4 h-4" />
        Download App
      </button>
      {modalType === "ios" && (
        <IosInstructions darkMode={darkMode} onClose={() => setModalType(null)} />
      )}
      {modalType === "android" && (
        <AndroidInstructions darkMode={darkMode} onClose={() => setModalType(null)} />
      )}
      {modalType === "desktop" && (
        <DesktopInstructions darkMode={darkMode} onClose={() => setModalType(null)} />
      )}
    </>
  );
}
