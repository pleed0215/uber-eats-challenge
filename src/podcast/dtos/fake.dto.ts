import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "./output.dto";

@InputType()
export class SeedPodcastAndEpisodeInput {
  @Field((type) => Int)
  numPodcast: number;

  @Field((type) => Int)
  minEpisode: number = 5;

  @Field((type) => Int)
  maxEpisode: number = 100;
}

@ObjectType()
export class SeedPodcastAndEpisodeOutput extends CoreOutput {}

@ObjectType()
export class SeedReviewsOutput extends CoreOutput {}
