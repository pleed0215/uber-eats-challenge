import { Field, InputType, Int, PartialType, PickType } from "@nestjs/graphql";
import { Podcast } from "../entities/podcast.entity";

@InputType()
export class UpdatePodcastInput extends PartialType(
  PickType(
    Podcast,
    ["title", "category", "description", "thumbnail"],
    InputType
  )
) {
  @Field((type) => Int)
  podcastId: number;
}
