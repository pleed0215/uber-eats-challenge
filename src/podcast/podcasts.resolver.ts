import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { PodcastsService } from "./podcasts.service";
import { Podcast } from "./entities/podcast.entity";
import {
  CreatePodcastInput,
  CreatePodcastOutput,
} from "./dtos/create-podcast.dto";
import { CoreOutput } from "./dtos/output.dto";
import {
  PodcastSearchInput,
  PodcastOutput,
  EpisodesOutput,
  EpisodesSearchInput,
  GetAllPodcastsOutput,
  GetAllPodcastsInput,
  GetRecentlyPodcastInput,
  GetRecentlyPodcastOutput,
  GetPodcastsByCategoryOutput,
  GetPodcastsByCategoryInput,
  GetRecentlyEpisodesOutput,
  GetEpisodesInput,
  GetEpisodesOutput,
} from "./dtos/podcast.dto";
import { UpdatePodcastInput } from "./dtos/update-podcast.dto";
import { Episode } from "./entities/episode.entity";
import {
  CreateEpisodeInput,
  CreateEpisodeOutput,
} from "./dtos/create-episode.dto";
import { UpdateEpisodeInput } from "./dtos/update-episode.dto";
import { Role } from "src/auth/role.decorator";
import { AuthUser } from "src/auth/auth-user.decorator";
import {
  SearchPodcastInput,
  SearchPodcastOutput,
} from "./dtos/search-podcast.dto";
import {
  ReviewPodcastInput,
  ReviewPodcastOutput,
  SeePodcastReviewsInput,
  SeePodcastReviewsOutput,
} from "./dtos/review-podcast.dto";
import {
  ToggleSubscriptionInput,
  ToggleSubscriptionOutput,
} from "./dtos/toggle-subscription.dto";
import {
  SeeSubscriptionInput,
  SeeSubscriptionOutput,
} from "./dtos/see-subscriptions.dto";
import {
  MarkEpisodeAsPlayedInput,
  MarkEpisodeAsPlayedOutput,
} from "./dtos/mark-as-played.dto";
import {
  SeedPodcastAndEpisodeInput,
  SeedPodcastAndEpisodeOutput,
  SeedReviewsOutput,
} from "./dtos/fake.dto";

@Resolver((of) => Podcast)
export class PodcastsResolver {
  constructor(private readonly podcastsService: PodcastsService) {}

  @Query((returns) => GetAllPodcastsOutput)
  getAllPodcasts(
    @Args("input") input: GetAllPodcastsInput
  ): Promise<GetAllPodcastsOutput> {
    return this.podcastsService.getAllPodcasts(input);
  }

  @Mutation((returns) => CreatePodcastOutput)
  @Role(["Host"])
  createPodcast(
    @AuthUser() authUser,
    @Args("input") createPodcastInput: CreatePodcastInput
  ): Promise<CreatePodcastOutput> {
    return this.podcastsService.createPodcast(authUser, createPodcastInput);
  }

  @Query((returns) => PodcastOutput)
  getPodcast(
    @Args("input") podcastSearchInput: PodcastSearchInput
  ): Promise<PodcastOutput> {
    return this.podcastsService.getPodcast(podcastSearchInput.id);
  }

  @Mutation((returns) => CoreOutput)
  @Role(["Host"])
  deletePodcast(
    @AuthUser() authUser,
    @Args("input") podcastSearchInput: PodcastSearchInput
  ): Promise<CoreOutput> {
    return this.podcastsService.deletePodcast(authUser, podcastSearchInput.id);
  }

  @Mutation((returns) => CoreOutput)
  @Role(["Host"])
  updatePodcast(
    @AuthUser() authUser,
    @Args("input") updatePodcastInput: UpdatePodcastInput
  ): Promise<CoreOutput> {
    return this.podcastsService.updatePodcast(authUser, updatePodcastInput);
  }
  // today assignment
  @Query((returns) => SearchPodcastOutput)
  @Role(["Any"])
  searchPodcast(
    @Args("input") input: SearchPodcastInput
  ): Promise<SearchPodcastOutput> {
    return this.podcastsService.searchPodcastByTitle(input);
  }

  @Mutation((returns) => ReviewPodcastOutput)
  @Role(["Listener"])
  reviewPodcast(
    @AuthUser() authUser,
    @Args("input") input: ReviewPodcastInput
  ): Promise<ReviewPodcastOutput> {
    return this.podcastsService.reviewPodcast(authUser, input);
  }

  @Mutation((returns) => ToggleSubscriptionOutput)
  @Role(["Listener"])
  subscribeToPodcast(
    @AuthUser() authUser,
    @Args("input") input: ToggleSubscriptionInput
  ): Promise<ToggleSubscriptionOutput> {
    return this.podcastsService.toggleSubscription(authUser, input);
  }

  @Query((returns) => SeeSubscriptionOutput)
  @Role(["Listener"])
  seeSubscribtions(
    @AuthUser() authUser,
    @Args("input") input: SeeSubscriptionInput
  ): Promise<SeeSubscriptionOutput> {
    return this.podcastsService.seeSubscriptions(authUser, input);
  }

  @Query((returns) => SeePodcastReviewsOutput)
  @Role(["Any"])
  seePodcastReviews(
    @Args("input") input: SeePodcastReviewsInput
  ): Promise<SeePodcastReviewsOutput> {
    return this.podcastsService.seePodcastReviews(input);
  }
}

@Resolver((of) => Episode)
export class EpisodeResolver {
  constructor(private readonly podcastService: PodcastsService) {}

  @Query((returns) => EpisodesOutput)
  getEpisodes(
    @Args("input") input: GetEpisodesInput
  ): Promise<GetEpisodesOutput> {
    return this.podcastService.getEpisodes(input);
  }

  @Mutation((returns) => CreateEpisodeOutput)
  @Role(["Host"])
  createEpisode(
    @Args("input") createEpisodeInput: CreateEpisodeInput
  ): Promise<CreateEpisodeOutput> {
    return this.podcastService.createEpisode(createEpisodeInput);
  }

  @Mutation((returns) => CoreOutput)
  @Role(["Host"])
  updateEpisode(
    @AuthUser() authUser,
    @Args("input") updateEpisodeInput: UpdateEpisodeInput
  ): Promise<CoreOutput> {
    return this.podcastService.updateEpisode(authUser, updateEpisodeInput);
  }

  @Mutation((returns) => CoreOutput)
  @Role(["Host"])
  deleteEpisode(
    @AuthUser() authUser,
    @Args("input") episodesSearchInput: EpisodesSearchInput
  ): Promise<CoreOutput> {
    return this.podcastService.deleteEpisode(authUser, episodesSearchInput);
  }

  @Mutation((returns) => MarkEpisodeAsPlayedOutput)
  @Role(["Listener"])
  markEpisodeAsPlayed(
    @AuthUser() authUser,
    @Args("input") input: MarkEpisodeAsPlayedInput
  ): Promise<MarkEpisodeAsPlayedOutput> {
    return this.podcastService.markEpisodeAsPlayed(authUser, input);
  }

  @Role(["Any"])
  @Mutation((returns) => SeedPodcastAndEpisodeOutput)
  seedPodcastAndEpisode(
    @Args("input") input: SeedPodcastAndEpisodeInput
  ): Promise<SeedPodcastAndEpisodeOutput> {
    return this.podcastService.seedPodcastAndEpisode(input);
  }

  @Role(["Any"])
  @Mutation((returns) => SeedReviewsOutput)
  seedFakeReviews(): Promise<SeedReviewsOutput> {
    return this.podcastService.seedReviews();
  }

  @Role(["Any"])
  @Query((returns) => GetRecentlyPodcastOutput)
  getRecentlyPodcast(
    @Args("input") input: GetRecentlyPodcastInput
  ): Promise<GetRecentlyPodcastOutput> {
    return this.podcastService.getRecentlyPodcast(input);
  }

  @Role(["Any"])
  @Query((returns) => GetPodcastsByCategoryOutput)
  getPodcastByCategory(
    @Args("input") input: GetPodcastsByCategoryInput
  ): Promise<GetPodcastsByCategoryOutput> {
    return this.podcastService.getPodcastsByCategory(input);
  }

  @Role(["Any"])
  @Query((returns) => GetRecentlyEpisodesOutput)
  getRecentlyEpisodes(
    @Args("input") input: GetRecentlyPodcastInput
  ): Promise<GetRecentlyEpisodesOutput> {
    return this.podcastService.getRecentlyEpisode(input);
  }
}
