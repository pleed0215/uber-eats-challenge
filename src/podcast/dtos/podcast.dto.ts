import { Field, ObjectType, InputType, Int, PickType } from "@nestjs/graphql";
import {
  CoreOutput,
  CorePaginationInput,
  CorePaginationOutput,
} from "./output.dto";
import { Podcast } from "../entities/podcast.entity";
import { IsInt } from "class-validator";
import { Episode } from "../entities/episode.entity";

@InputType()
export class GetAllPodcastsInput extends CorePaginationInput {}

@ObjectType()
export class GetAllPodcastsOutput extends CorePaginationOutput {
  @Field((type) => [Podcast], { nullable: true })
  podcasts?: Podcast[];
}

@InputType()
export class PodcastSearchInput extends PickType(Podcast, ["id"], InputType) {}

@ObjectType()
export class PodcastOutput extends CoreOutput {
  @Field((type) => Podcast, { nullable: true })
  podcast?: Podcast;
}

@ObjectType()
export class EpisodesOutput extends CoreOutput {
  @Field((type) => [Episode], { nullable: true })
  episodes?: Episode[];
}

@InputType()
export class EpisodesSearchInput {
  @Field((type) => Int)
  @IsInt()
  podcastId: number;

  @Field((type) => Int)
  @IsInt()
  episodeId: number;
}

export class GetEpisodeOutput extends CoreOutput {
  episode?: Episode;
}
