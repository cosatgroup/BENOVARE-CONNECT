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
app.use(express.json());

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

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Benovare Connect API en écoute sur le port ${port}`);
});
