import { NextResponse } from "next/server";

/**
 * Version du déploiement en cours.
 *
 * Sur Vercel, chaque commit produit un déploiement avec un SHA unique : les
 * clients comparent ce SHA à celui embarqué dans leur page pour savoir qu'une
 * mise à jour est disponible.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
