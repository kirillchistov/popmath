export async function notifyAdmin(
  subject: string,
  text: string,
): Promise<boolean> {
  const to = process.env.ADMIN_EMAIL?.trim();
  if (!to) return false;

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const from =
    process.env.MAIL_FROM?.trim() || 'Матешка <onboarding@resend.dev>';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
