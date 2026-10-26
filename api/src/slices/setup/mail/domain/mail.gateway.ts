// @scope:api
// @slice:setup/mail
// @layer:domain
// @type:gateway

import { IOutboundMail, IMailResult } from './mail.types';

export abstract class IMailGateway {
  abstract send(message: IOutboundMail): Promise<IMailResult>;
}
