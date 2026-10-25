// @scope:api
// @slice:setup/mail
// @layer:domain
// @type:types

export interface IMailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface IMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}
