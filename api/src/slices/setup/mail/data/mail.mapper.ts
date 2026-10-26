// @scope:api
// @slice:setup/mail
// @layer:data
// @type:mapper

import { Injectable } from '@nestjs/common';
import { IOutboundMail, IMailResult } from '../domain/mail.types';
import { ISmtpMessage, ISmtpSendResult } from './repositories/smtp/smtp.types';

@Injectable()
export class MailMapper {
  toSmtp(message: IOutboundMail): ISmtpMessage {
    return {
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
      cc: message.cc,
      bcc: message.bcc,
    };
  }

  toResult(result: ISmtpSendResult): IMailResult {
    return {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    };
  }
}
