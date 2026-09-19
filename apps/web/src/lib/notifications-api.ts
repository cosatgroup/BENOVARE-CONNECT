import { authRequest } from "./api";

export interface AppNotification {
  id: string;
  categorie: "OPPORTUNITE" | "ECHEANCE_CONTRACTUELLE" | "MESSAGE" | "ALERTE_SYSTEME";
  titre: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
}

export function listerNotifications() {
  return authRequest<{ notifications: AppNotification[]; nonLues: number }>("/api/notifications");
}

export function marquerLue(id: string) {
  return authRequest<AppNotification>(`/api/notifications/${id}/lu`, { method: "POST" });
}

export function toutMarquerLu() {
  return authRequest<{ ok: true }>("/api/notifications/tout-lire", { method: "POST" });
}
