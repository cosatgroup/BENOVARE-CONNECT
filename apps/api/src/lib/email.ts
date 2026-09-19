import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Expéditeur par défaut de Resend, valable sans domaine vérifié — à
// remplacer par une adresse @benovare... une fois le domaine configuré
// dans Resend (DNS SPF/DKIM).
const FROM_ADDRESS = process.env.OTP_EMAIL_FROM ?? "Benovare Connect <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[OTP:no-provider] code pour ${to} : ${code}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Votre code de vérification Benovare Connect",
    html: `
      <p>Votre code de vérification est :</p>
      <p style="font-size: 28px; font-weight: 600; letter-spacing: 6px;">${code}</p>
      <p>Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette
      demande, ignorez cet e-mail.</p>
    `,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Échec d'envoi de l'e-mail OTP :", error);
    throw new Error("Échec de l'envoi du code de vérification");
  }
}

// §7.4 — Envoyé une fois le paiement d'un devis confirmé (KKiaPay, FedaPay
// ou virement bancaire validé manuellement) ; le compte saisit ce code
// dans l'app pour activer sa formule.
export async function sendLicenceEmail(
  to: string,
  code: string,
  formule: string,
  montant: number,
  devise: string
): Promise<void> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[LICENCE:no-provider] code pour ${to} (${formule}, ${montant} ${devise}) : ${code}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Votre code d'activation Benovare Connect",
    html: `
      <p>Votre paiement de ${montant.toLocaleString("fr-FR")} ${devise} pour la formule
      <strong>${formule}</strong> a été confirmé. Voici votre code d'activation :</p>
      <p style="font-size: 24px; font-weight: 600; letter-spacing: 4px;">${code}</p>
      <p>Saisissez ce code dans la page Abonnement de votre compte Benovare Connect pour
      l'activer.</p>
    `,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Échec d'envoi de l'e-mail de licence :", error);
    throw new Error("Échec de l'envoi du code de licence");
  }
}
