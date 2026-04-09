import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";

import { getAuthContext } from "../../../lib/auth";
import { getMedicalSafetyCopy } from "../../../lib/medicalSafetyCopy";
import RuntimeUserButton from "../RuntimeUserButton";
import TrackingHubClient from "./TrackingHubClient";

export const dynamic = "force-dynamic";

export default async function EspaceSuiviPage() {
  const auth = await getAuthContext();
  const copy = (path: string, vars: Record<string, string> = {}) =>
    getMedicalSafetyCopy("fr", path, vars);
  const authenticatedUserId =
    auth.isAuthenticated && auth.userId ? auth.userId : null;
  const isPreviewMode = auth.mode === "preview" && authenticatedUserId !== null;
  const isRuntimeMode = auth.mode === "runtime";
  const hasDeploymentConfigIssue =
    auth.runtimeIssue === "missing_runtime_configuration";
  const fallbackTitle = hasDeploymentConfigIssue
    ? copy("screens.runtime.authDeploymentIssueTitle")
    : auth.mode === "disabled"
      ? copy("screens.runtime.authUnavailableTitle")
      : "Connexion requise pour ouvrir le suivi";
  const fallbackBody = hasDeploymentConfigIssue
    ? copy("screens.runtime.authDeploymentIssueBody")
    : auth.mode === "disabled"
      ? copy("screens.runtime.authUnavailableBody")
      : "Connecte-toi pour accéder à ton journal personnel et à tes modèles de repas.";

  return (
    <main className="app-shell">
      <section className="app-shell__header">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">Espace / Suivi</p>
          <p className="app-shell__status">
            Journal descriptif, sans interprétation clinique.
          </p>
        </div>
        <h1 className="app-shell__title">Suivi</h1>
        <p className="app-shell__description">
          Enregistre tes repas, tes symptômes et un résumé hebdomadaire
          descriptif. Cette page aide à revoir ton historique; elle ne prouve
          pas une cause ni un déclencheur.
        </p>
      </section>

      <section className="app-shell__section">
        {authenticatedUserId ? (
          <>
            <div className="app-shell__meta">
              <p className="app-shell__eyebrow">Journal</p>
              <p className="app-shell__status">Historique personnel</p>
            </div>
            {isRuntimeMode ? <RuntimeUserButton /> : null}
            {isPreviewMode ? (
              <Alert>
                <AlertTitle>
                  {copy("screens.runtime.previewModeTitle")}
                </AlertTitle>
                <AlertDescription>
                  {copy("screens.runtime.previewModeBody", {
                    userId: authenticatedUserId,
                  })}
                </AlertDescription>
              </Alert>
            ) : null}
            <TrackingHubClient
              auth={
                isPreviewMode
                  ? { mode: "preview", userId: authenticatedUserId }
                  : { mode: "runtime" }
              }
            />
          </>
        ) : (
          <>
            <div className="app-shell__meta">
              <p className="app-shell__eyebrow">Accès</p>
              <p className="app-shell__status">
                {hasDeploymentConfigIssue
                  ? "Configuration requise"
                  : auth.mode === "disabled"
                    ? "Version locale sans authentification"
                    : "Authentification requise"}
              </p>
            </div>
            <h2 className="app-shell__section-title">{fallbackTitle}</h2>
            <p className="app-shell__text">{fallbackBody}</p>
            {isRuntimeMode ? (
              <p className="app-shell__text">
                <Link href="/sign-in">{copy("screens.runtime.signInCta")}</Link>
              </p>
            ) : null}
          </>
        )}
      </section>

      <p className="app-shell__text">
        <Link href="/espace">Gérer les droits et les exports</Link>
      </p>
    </main>
  );
}
