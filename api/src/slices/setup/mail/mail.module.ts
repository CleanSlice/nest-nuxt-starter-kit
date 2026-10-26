// @scope:api
// @slice:setup/mail
// @layer:presentation
// @type:module

import { Global, Module } from '@nestjs/common';
import { MailService } from './domain/mail.service';
import { IMailGateway } from './domain/mail.gateway';
import { SmtpMailGateway } from './data/mail.gateway';
import { MailMapper } from './data/mail.mapper';
import { SmtpRepository } from './data/repositories/smtp/smtp.repository';

@Global()
@Module({
  providers: [
    MailService,
    MailMapper,
    SmtpRepository,
    {
      provide: IMailGateway,
      useClass: SmtpMailGateway,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
