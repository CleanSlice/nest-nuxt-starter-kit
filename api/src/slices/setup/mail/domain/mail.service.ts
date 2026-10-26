// @scope:api
// @slice:setup/mail
// @layer:domain
// @type:service

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMailGateway } from './mail.gateway';
import { IMailMessage, IMailResult } from './mail.types';
import { MailNotConfiguredError } from './mail.errors';

@Injectable()
export class MailService {
  constructor(
    private readonly mailGateway: IMailGateway,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sends one message. `from` falls back to SMTP_FROM; a message without a
   * sender is a configuration error, not a transport error.
   */
  async send(message: IMailMessage): Promise<IMailResult> {
    const from = message.from || this.config.get<string>('SMTP_FROM');

    if (!from) {
      throw new MailNotConfiguredError('SMTP_FROM');
    }

    return this.mailGateway.send({ ...message, from });
  }
}
