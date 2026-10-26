import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { EntityIdPipe, IsEntityId, entityId } from './id.validator';
import { formatId } from './domain';

class MoveFileDto {
  @IsEntityId('team')
  teamId!: string;
}

describe('entity identity validation', () => {
  const teamId = formatId('team');

  it('entityId checks the prefix once, at build time', () => {
    expect(() => entityId('Team')).toThrow(TypeError);
    const check = entityId('team');
    expect(check(teamId)).toBe(true);
    expect(check(formatId('user'))).toBe(false);
    expect(check(teamId.toUpperCase())).toBe(false);
  });

  it('@IsEntityId rejects another entity, a UUID and a non-string', async () => {
    const accepted = Object.assign(new MoveFileDto(), { teamId });
    expect(await validate(accepted)).toHaveLength(0);

    for (const value of [
      formatId('user'),
      '23a63374-d40f-48a1-a952-e38524413be4',
      42,
      undefined,
    ]) {
      const dto = Object.assign(new MoveFileDto(), { teamId: value });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual({
        isEntityId: 'teamId must be a team primary identity',
      });
    }
  });

  it('EntityIdPipe passes a canonical ID through and answers 400 otherwise', () => {
    const pipe = new EntityIdPipe('team');
    expect(pipe.transform(teamId)).toBe(teamId);
    expect(() => pipe.transform(formatId('user'))).toThrow(BadRequestException);
    expect(() => pipe.transform('team-calm-rivers-k8m4p2d7n9xi')).toThrow(
      BadRequestException,
    );
    expect(() => new EntityIdPipe('')).toThrow(TypeError);
  });
});
