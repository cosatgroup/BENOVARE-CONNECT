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
