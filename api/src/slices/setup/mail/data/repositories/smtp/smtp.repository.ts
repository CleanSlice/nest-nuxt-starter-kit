// @scope:api
// @slice:setup/mail
// @layer:data
// @type:repository

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { ISmtpConfig, ISmtpMessage, ISmtpSendResult } from './smtp.types';

const toAddress = (entry: string | { address: string }): string =>
  typeof entry === 'string' ? entry : entry.address;

/**
 * Black box over an SMTP server. Locally that is Mailpit from
 * docker-compose.yml; in production any SMTP relay (SES, Postmark, Resend...).
 * Knows nothing about the application: only env vars and nodemailer.
 */
@Injectable()
export class SmtpRepository {
  private readonly transporter: Transporter;

  constructor(config: ConfigService) {
    const smtp = SmtpRepository.readConfig(config);

    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });
  }

  async send(message: ISmtpMessage): Promise<ISmtpSendResult> {
    const info = await this.transporter.sendMail(message);

    return {
      messageId: info.messageId,
      accepted: info.accepted.map(toAddress),
      rejected: info.rejected.map(toAddress),
      response: info.response,
    };
  }

  /** Opens and closes a connection; true when the server answers. */
  async verify(): Promise<boolean> {
    return this.transporter.verify();
  }

  private static readConfig(config: ConfigService): ISmtpConfig {
    return {
      host: config.get<string>('SMTP_HOST', 'localhost'),
      port: Number(config.get<string>('SMTP_PORT', '1025')),
      secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
      user: config.get<string>('SMTP_USER') || undefined,
      password: config.get<string>('SMTP_PASSWORD') || undefined,
    };
  }
}
