import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { Podcast } from '../entities/podcast.entity';

@InputType()
export class UpdatePodcastPayload extends PartialType(
  PickType(Podcast, ['title', 'category', 'rating'], InputType),
) {}

@InputType()
export class UpdatePodcastInput extends PickType(Podcast, ['id'], InputType) {
  @Field(type => UpdatePodcastPayload)
  payload: UpdatePodcastPayload;
}
