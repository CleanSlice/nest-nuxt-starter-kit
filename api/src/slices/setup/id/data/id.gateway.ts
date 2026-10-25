// @scope:api
// @slice:setup/id
// @layer:data
// @type:gateway

import { Injectable } from '@nestjs/common';
import { PrismaService } from '#setup/prisma';
import { IIdGateway } from '../domain/id.gateway';
import { formatId } from '../domain/idFormat';
import { withIdRetry } from './idRetry';

@Injectable()
export class IdGateway extends IIdGateway {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Burns an identity in its own statement, before the irreversible external
   * work it names (a file key, a provider object, a webhook secret). Call it
   * outside the business transaction: a reservation must commit first.
   */
  async reserve(prefix: string): Promise<string> {
    const row = await withIdRetry(() =>
      this.prisma.idReservation.create({ data: { id: formatId(prefix) } }),
    );
    return row.id;
  }
}
