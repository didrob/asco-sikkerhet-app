interface EmailOptions {
  recipients: string[];
  subject: string;
  body: string;
  useBcc?: boolean;
}

export function openEmailClient({ recipients, subject, body, useBcc = false }: EmailOptions) {
  const to = useBcc ? '' : recipients.join(',');
  const bcc = useBcc ? recipients.join(',') : '';
  
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  if (useBcc && bcc) params.set('bcc', bcc);
  
  const mailtoUrl = `mailto:${to}?${params.toString()}`;
  window.location.href = mailtoUrl;
}

export function generateTrainingInviteEmail(
  courseTitle: string,
  dueDate?: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = `Opplæring: ${courseTitle}`;
  
  let body = `Hei,\n\n`;
  body += `Du er tildelt opplæringen "${courseTitle}".\n\n`;
  
  if (dueDate) {
    body += `Frist: ${dueDate.toLocaleDateString('nb-NO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`;
  }
  
  body += `Logg inn for å starte: ${baseUrl || window.location.origin}/training\n\n`;
  body += `Med vennlig hilsen,\nASCO`;
  
  return { subject, body };
}
