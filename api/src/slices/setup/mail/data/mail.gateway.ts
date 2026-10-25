// @scope:api
// @slice:setup/mail
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { IMailGateway } from '../domain/mail.gateway';
import { IMailMessage, IMailResult } from '../domain/mail.types';
import { MailDeliveryError } from '../domain/mail.errors';
import { SmtpRepository } from './repositories/smtp/smtp.repository';
import { MailMapper } from './mail.mapper';

/**
 * Delivers through the SMTP repository. To add another provider (SES API,
 * Resend...), add a sibling repository under data/repositories/ and a second
 * gateway; mail.module.ts decides which one backs IMailGateway.
 */
@Injectable()
export class SmtpMailGateway extends IMailGateway {
  constructor(
    private readonly smtp: SmtpRepository,
    private readonly mapper: MailMapper,
  ) {
    super();
  }

  async send(message: IMailMessage): Promise<IMailResult> {
    try {
      const result = await this.smtp.send(this.mapper.toSmtp(message));
      return this.mapper.toResult(result);
    } catch (error) {
      throw new MailDeliveryError(message.to, error as Error);
    }
  }
}
