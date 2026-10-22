"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Modale de mise à jour.
 *
 * La page embarque la version du déploiement qui l'a servie. On interroge
 * /api/version, toujours servie par le déploiement le plus récent. Si les
 * versions diffèrent, une nouvelle version est en ligne.
 *
 * La modale est portée sur document.body : un ancêtre transformé empêche un
 * élément « fixed » de se coller à l'écran.
 */

const checkIntervalMs = 60_000;
const reloadGuardKey = "englishai-standalone-reload";

function isInstalledApp(): boolean {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const overlay = window.matchMedia("(display-mode: window-controls-overlay)").matches;
  const ios =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || overlay || ios;
}

function rememberReload(version: string): boolean {
  try {
    if (sessionStorage.getItem(reloadGuardKey) === version) return false;
    sessionStorage.setItem(reloadGuardKey, version);
    return true;
  } catch {
    return false;
  }
}

function clearReloadGuard(): void {
  try {
    sessionStorage.removeItem(reloadGuardKey);
  } catch {
    // Session privée : le garde-fou est optionnel.
  }
}

type UpdateBannerProps = {
  /** Version du déploiement qui a rendu la page (SHA du commit, ou "dev"). */
  initialVersion: string;
};

export function UpdateBanner({ initialVersion }: UpdateBannerProps) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if (initialVersion === "dev") {
      return;
    }

    let isCancelled = false;
    let isFirstCheck = true;

    async function checkVersion() {
      const launch = isFirstCheck;
      isFirstCheck = false;

      try {
        const response = await fetch("/api/version", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { version?: string };
        const version = data.version;
        const mismatch = Boolean(
          version && version !== "dev" && version !== initialVersion,
        );

        if (isCancelled) return;

        if (!mismatch) {
          clearReloadGuard();
          return;
        }

        // L’app installée peut rouvrir un document ancien. On recharge une fois
        // au lancement ; si le document reste ancien, la modale prend le relais.
        if (launch && isInstalledApp() && version && rememberReload(version)) {
          window.location.reload();
          return;
        }

        setIsUpdateAvailable(true);
      } catch {
        // Hors ligne ou serveur injoignable : on réessaiera au prochain tick.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    }

    function handleReturn() {
      void checkVersion();
    }

    const interval = window.setInterval(() => void checkVersion(), checkIntervalMs);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleReturn);
    window.addEventListener("pageshow", handleReturn);
    void checkVersion();

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleReturn);
      window.removeEventListener("pageshow", handleReturn);
    };
  }, [initialVersion]);

  if (!isUpdateAvailable || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-update-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 id="app-update-title" className="text-base font-semibold text-foreground">
          Nouvelle version disponible
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Mets à jour pour profiter des dernières améliorations.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Mettre à jour
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
