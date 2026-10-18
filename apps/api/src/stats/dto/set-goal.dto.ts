import { IsInt, Max, Min } from 'class-validator';

import { GOAL_TARGET_MAX } from '@reading/shared';

export class SetGoalDto {
  // Books to finish that year
  @IsInt()
  @Min(1)
  @Max(GOAL_TARGET_MAX)
  target: number;
}
