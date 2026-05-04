import sgMail from '@sendgrid/mail';
import { config } from '../config';

if (config.SENDGRID_API_KEY) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
}

interface AssignedEmailData {
  to: string;
  name: string;
  choreTitle: string;
  dueDate: string;
  priority: string;
  description?: string | null;
}

interface ReminderEmailData {
  to: string;
  name: string;
  choreTitle: string;
  dueDate: string;
}

interface InviteEmailData {
  to: string;
  name: string;
  tempPassword: string;
  loginUrl: string;
}

export async function sendAssignedEmail(data: AssignedEmailData): Promise<void> {
  if (!config.SENDGRID_API_KEY || !config.SENDGRID_ASSIGNED_TEMPLATE_ID) {
    console.warn('[Email] SendGrid not configured, skipping assigned email');
    return;
  }

  await sgMail.send({
    to: data.to,
    from: config.SENDGRID_FROM_EMAIL!,
    templateId: config.SENDGRID_ASSIGNED_TEMPLATE_ID,
    dynamicTemplateData: {
      name: data.name,
      choreTitle: data.choreTitle,
      dueDate: data.dueDate,
      priority: data.priority,
      description: data.description ?? '',
    },
  });
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  if (!config.SENDGRID_API_KEY || !config.SENDGRID_REMINDER_TEMPLATE_ID) {
    console.warn('[Email] SendGrid not configured, skipping reminder email');
    return;
  }

  await sgMail.send({
    to: data.to,
    from: config.SENDGRID_FROM_EMAIL!,
    templateId: config.SENDGRID_REMINDER_TEMPLATE_ID,
    dynamicTemplateData: {
      name: data.name,
      choreTitle: data.choreTitle,
      dueDate: data.dueDate,
    },
  });
}

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  if (!config.SENDGRID_API_KEY || !config.SENDGRID_INVITE_TEMPLATE_ID) {
    console.warn('[Email] SendGrid not configured, skipping invite email');
    return;
  }

  await sgMail.send({
    to: data.to,
    from: config.SENDGRID_FROM_EMAIL!,
    templateId: config.SENDGRID_INVITE_TEMPLATE_ID,
    dynamicTemplateData: {
      name: data.name,
      tempPassword: data.tempPassword,
      loginUrl: data.loginUrl,
    },
  });
}
