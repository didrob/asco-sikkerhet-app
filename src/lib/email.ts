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

export function generateReminderEmail(
  courseTitle: string,
  daysOverdue: number,
  dueDate: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = `Påminnelse: Forfalt opplæring - ${courseTitle}`;
  
  let body = `Hei,\n\n`;
  body += `Dette er en påminnelse om at opplæringen "${courseTitle}" hadde frist `;
  body += `${dueDate.toLocaleDateString('nb-NO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })} (${daysOverdue} ${daysOverdue === 1 ? 'dag' : 'dager'} siden).\n\n`;
  body += `Vennligst fullfør opplæringen så snart som mulig.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/training\n\n`;
  body += `Med vennlig hilsen,\nHMS-avdelingen`;
  
  return { subject, body };
}

export function generateBulkReminderEmail(
  users: { name: string; email: string; courseTitle: string; daysOverdue: number }[],
  baseUrl?: string
): { subject: string; body: string } {
  // For bulk reminders, we'll create a generic message
  const courseCount = new Set(users.map(u => u.courseTitle)).size;
  const subject = courseCount === 1 
    ? `Påminnelse: Forfalt opplæring - ${users[0].courseTitle}`
    : `Påminnelse: Forfalt opplæring`;
  
  let body = `Hei,\n\n`;
  body += `Dette er en påminnelse om forfalt opplæring.\n\n`;
  body += `Vennligst fullfør opplæringen så snart som mulig.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/training\n\n`;
  body += `Med vennlig hilsen,\nHMS-avdelingen`;
  
  return { subject, body };
}

/**
 * Generates a welcome email for new users
 */
export function generateNewUserEmail(
  fullName: string,
  email: string,
  tempPassword: string,
  expiresAt: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = 'Velkommen til ASCO Prosedyrehub - Din konto er klar';
  
  let body = `Hei ${fullName},\n\n`;
  body += `Din konto i ASCO Prosedyrehub er opprettet.\n\n`;
  body += `Innloggingsdetaljer:\n`;
  body += `E-post: ${email}\n`;
  body += `Midlertidig passord: ${tempPassword}\n\n`;
  body += `Du må logge inn og endre passordet ditt innen `;
  body += `${expiresAt.toLocaleDateString('nb-NO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/auth\n\n`;
  body += `Med vennlig hilsen,\nASCO`;
  
  return { subject, body };
}

/**
 * Generates a password reset email
 */
export function generatePasswordResetEmail(
  fullName: string,
  email: string,
  newPassword: string,
  expiresAt: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = 'ASCO Prosedyrehub - Nytt passord';
  
  let body = `Hei ${fullName},\n\n`;
  body += `Et nytt passord er generert for din konto.\n\n`;
  body += `E-post: ${email}\n`;
  body += `Nytt passord: ${newPassword}\n\n`;
  body += `Du må logge inn og endre passordet ditt innen `;
  body += `${expiresAt.toLocaleDateString('nb-NO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/auth\n\n`;
  body += `Med vennlig hilsen,\nASCO`;
  
  return { subject, body };
}

/**
 * Generates an email for bulk user import
 */
export function generateBulkImportEmail(
  users: { email: string; fullName: string; tempPassword: string }[],
  expiresAt: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = 'ASCO Prosedyrehub - Nye brukerkontoer opprettet';
  
  let body = `Hei,\n\n`;
  body += `Følgende brukerkontoer er opprettet i ASCO Prosedyrehub:\n\n`;
  
  users.forEach((user, index) => {
    body += `${index + 1}. ${user.fullName}\n`;
    body += `   E-post: ${user.email}\n`;
    body += `   Passord: ${user.tempPassword}\n\n`;
  });
  
  body += `Alle brukere må logge inn og endre passord innen `;
  body += `${expiresAt.toLocaleDateString('nb-NO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/auth\n\n`;
  body += `Med vennlig hilsen,\nASCO`;
  
  return { subject, body };
}
