// @scope:api
// @slice:setup/mail
// @layer:data
// @type:types

export interface ISmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
}

export interface ISmtpMessage {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface ISmtpSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}
