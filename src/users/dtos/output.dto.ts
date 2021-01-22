import { ObjectType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

@ObjectType()
export class CoreOutput {
  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  error?: string;

  @Field(type => Boolean)
  @IsBoolean()
  ok: boolean;
}
