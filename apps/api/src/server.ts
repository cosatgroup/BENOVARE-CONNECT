import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Benovare Connect API en écoute sur le port ${port}`);
});
