import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';
import { EpisodesSearchInput } from './podcast.dto';

@InputType()
export class UpdateEpisodeInput extends EpisodesSearchInput {
  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  readonly title?: string;

  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  readonly category?: string;
}
