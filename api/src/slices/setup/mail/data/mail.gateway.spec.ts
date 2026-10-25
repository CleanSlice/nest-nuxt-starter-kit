import { SmtpMailGateway } from './mail.gateway';
import { MailMapper } from './mail.mapper';
import { SmtpRepository } from './repositories/smtp/smtp.repository';
import { ISmtpMessage, ISmtpSendResult } from './repositories/smtp/smtp.types';
import { MailDeliveryError } from '../domain/mail.errors';

describe('SmtpMailGateway', () => {
  const send = jest.fn<Promise<ISmtpSendResult>, [ISmtpMessage]>();
  const smtp = { send } as unknown as SmtpRepository;
  const gateway = new SmtpMailGateway(smtp, new MailMapper());
  const message = {
    from: 'App <noreply@app.test>',
    to: ['alice@example.com', 'bob@example.com'],
    subject: 'Hello',
    html: '<p>Hi</p>',
  };

  beforeEach(() => send.mockReset());

  it('maps the message to SMTP and the result back to the domain', async () => {
    send.mockResolvedValue({
      messageId: '<1@test>',
      accepted: ['alice@example.com'],
      rejected: ['bob@example.com'],
      response: '250 OK',
    });

    const result = await gateway.send(message);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: message.from,
        to: message.to,
        subject: 'Hello',
        html: '<p>Hi</p>',
      }),
    );
    expect(result).toEqual({
      messageId: '<1@test>',
      accepted: ['alice@example.com'],
      rejected: ['bob@example.com'],
    });
  });

  it('wraps transport failures in MailDeliveryError with the cause', async () => {
    const cause = new Error('ECONNREFUSED');
    send.mockRejectedValue(cause);

    const error: unknown = await gateway.send(message).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MailDeliveryError);
    const delivery = error as MailDeliveryError;
    expect(delivery.getCause()).toBe(cause);
    expect(delivery.message).toContain('alice@example.com, bob@example.com');
  });
});
