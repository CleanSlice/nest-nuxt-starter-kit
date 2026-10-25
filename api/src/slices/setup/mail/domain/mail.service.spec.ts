import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { IMailGateway } from './mail.gateway';
import { MailNotConfiguredError } from './mail.errors';
import { IMailMessage, IMailResult } from './mail.types';

describe('MailService', () => {
  const send = jest.fn<Promise<IMailResult>, [IMailMessage]>();
  const gateway: IMailGateway = { send };
  const message: IMailMessage = {
    to: 'alice@example.com',
    subject: 'Hello',
    text: 'Hi Alice',
  };

  const serviceWith = (env: Record<string, string>) =>
    new MailService(gateway, {
      get: (key: string) => env[key],
    } as unknown as ConfigService);

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({
      messageId: '<1@test>',
      accepted: ['alice@example.com'],
      rejected: [],
    });
  });

  it('fills from with SMTP_FROM when the message has none', async () => {
    await serviceWith({ SMTP_FROM: 'App <noreply@app.test>' }).send(message);

    expect(send).toHaveBeenCalledWith({
      ...message,
      from: 'App <noreply@app.test>',
    });
  });

  it('keeps an explicit from', async () => {
    await serviceWith({ SMTP_FROM: 'App <noreply@app.test>' }).send({
      ...message,
      from: 'Support <support@app.test>',
    });

    expect(send.mock.calls[0][0].from).toBe('Support <support@app.test>');
  });

  it('refuses to send without any sender', async () => {
    await expect(serviceWith({}).send(message)).rejects.toBeInstanceOf(
      MailNotConfiguredError,
    );
    expect(send).not.toHaveBeenCalled();
  });
});
