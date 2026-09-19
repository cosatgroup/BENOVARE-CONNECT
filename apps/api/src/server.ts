import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { partenairesRouter } from "./routes/partenaires";
import { besoinsRouter } from "./routes/besoins";
import { candidaturesRouter } from "./routes/candidatures";
import { missionsRouter } from "./routes/missions";
import { talentsRouter } from "./routes/talents";
import { opportunitesRouter } from "./routes/opportunites";
import { mesCandidaturesRouter } from "./routes/mes-candidatures";
import { talentMissionsRouter } from "./routes/talent-missions";
import { gestionnaireRouter } from "./routes/gestionnaire";
import { prestatairesRouter } from "./routes/prestataires";
import { projetsRouter } from "./routes/projets";
import { mesSoumissionsRouter } from "./routes/mes-soumissions";
import { prestataireMissionsRouter } from "./routes/prestataire-missions";
import { administrateurRouter } from "./routes/administrateur";
import { veilleRouter } from "./routes/veille";
import { maintenanceRouter } from "./routes/maintenance";
import { placementsRouter } from "./routes/placements";
import { notificationsRouter } from "./routes/notifications";
import { devisRouter } from "./routes/devis";
import { abonnementRouter } from "./routes/abonnement";
import { catalogueRouter } from "./routes/catalogue";
import { handleFedapayWebhook, handleKkiapayWebhook } from "./routes/webhooks";

const app = express();

// WEB_ORIGIN accepte une liste séparée par des virgules — utile pour
// autoriser à la fois le frontend déployé et un poste de dev local pointant
// vers cette API distante.
const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origine non autorisée par CORS"));
      }
    },
    credentials: true,
  })
);
// La signature FedaPay porte sur le corps brut de la requête : cette route
// doit donc lire le body en Buffer, avant le express.json() global qui le
// parserait et rendrait la vérification de signature impossible.
app.post("/api/webhooks/fedapay", express.raw({ type: "application/json" }), handleFedapayWebhook);

app.use(express.json());

app.post("/api/webhooks/kkiapay", handleKkiapayWebhook);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/partenaires", partenairesRouter);
app.use("/api/besoins", besoinsRouter);
app.use("/api/candidatures", candidaturesRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/talents", talentsRouter);
app.use("/api/opportunites", opportunitesRouter);
app.use("/api/mes-candidatures", mesCandidaturesRouter);
app.use("/api/talents/missions", talentMissionsRouter);
app.use("/api/gestionnaire", gestionnaireRouter);
app.use("/api/prestataires", prestatairesRouter);
app.use("/api/projets", projetsRouter);
app.use("/api/mes-soumissions", mesSoumissionsRouter);
app.use("/api/prestataires/missions", prestataireMissionsRouter);
app.use("/api/administrateur", administrateurRouter);
app.use("/api/veille", veilleRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/placements", placementsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/devis", devisRouter);
app.use("/api/abonnement", abonnementRouter);
app.use("/api/catalogue", catalogueRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Benovare Connect API en écoute sur le port ${port}`);
});
