import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RETURN = 'RETURN',
}

export class ReviewApplicationDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsString()
  @IsOptional()
  reason?: string;
}