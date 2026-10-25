// @scope:api
// @slice:setup/mail
// @layer:domain
// @type:gateway

import { IMailMessage, IMailResult } from './mail.types';

export abstract class IMailGateway {
  abstract send(message: IMailMessage): Promise<IMailResult>;
}
