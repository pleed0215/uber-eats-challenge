import { Injectable } from "@nestjs/common";
import {
  CreateEpisodeInput,
  CreateEpisodeOutput,
} from "./dtos/create-episode.dto";
import {
  CreatePodcastInput,
  CreatePodcastOutput,
} from "./dtos/create-podcast.dto";
import { UpdateEpisodeInput } from "./dtos/update-episode.dto";
import { UpdatePodcastInput } from "./dtos/update-podcast.dto";
import { Episode } from "./entities/episode.entity";
import { Podcast } from "./entities/podcast.entity";
import { CoreOutput } from "./dtos/output.dto";

import {
  PodcastOutput,
  EpisodesOutput,
  EpisodesSearchInput,
  GetAllPodcastsOutput,
  GetEpisodeOutput,
} from "./dtos/podcast.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { User, UserRole } from "src/users/entities/user.entity";
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

import { Review } from "./entities/review.entity";
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
} from "./dtos/fake.dto";

import * as faker from "faker";
import { min } from "class-validator";

@Injectable()
export class PodcastsService {
  constructor(
    @InjectRepository(Podcast)
    private readonly podcastRepository: Repository<Podcast>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async areYouCreator(
    user: User,
    artId: number,
    isEpisode: boolean = false
  ): Promise<boolean> {
    try {
      if (isEpisode) {
        const episode = await this.episodeRepository.findOneOrFail(artId, {
          relations: ["podcast", "podcast.host"],
        });
        return user.id === episode.podcast.hostId;
      } else {
        const podcast = await this.podcastRepository.findOneOrFail(artId);
        return user.id === podcast.hostId;
      }
    } catch (e) {
      return false;
    }
  }

  private readonly InternalServerErrorOutput = {
    ok: false,
    error: "Internal server error occurred.",
  };
  private readonly YouAreNotOwnerErrorOutput = {
    ok: false,
    error: "You are not owner of this",
  };

  async getAllPodcasts(): Promise<GetAllPodcastsOutput> {
    try {
      const podcasts = await this.podcastRepository.find();
      return {
        ok: true,
        podcasts,
      };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async createPodcast(
    host: User,
    { title, category }: CreatePodcastInput
  ): Promise<CreatePodcastOutput> {
    try {
      const newPodcast = this.podcastRepository.create({
        title,
        category,
        host,
      });
      const saved = await this.podcastRepository.save(newPodcast);
      console.log(saved);
      return {
        ok: true,
        id: saved.id,
      };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async getPodcast(id: number): Promise<PodcastOutput> {
    try {
      const podcast = await this.podcastRepository.findOne(
        { id },
        { relations: ["episodes"] }
      );
      if (!podcast) {
        return {
          ok: false,
          error: `Podcast with id ${id} not found`,
        };
      }
      return {
        ok: true,
        podcast,
      };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async deletePodcast(host: User, id: number): Promise<CoreOutput> {
    try {
      const { ok, error } = await this.getPodcast(id);

      if (!ok) {
        return { ok, error };
      }

      if (!this.areYouCreator(host, id)) {
        return this.YouAreNotOwnerErrorOutput;
      }

      await this.podcastRepository.delete({ id });
      return { ok };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async updatePodcast(
    host: User,
    { id, payload }: UpdatePodcastInput
  ): Promise<CoreOutput> {
    try {
      const { ok, error, podcast } = await this.getPodcast(id);
      if (!ok) {
        return { ok, error };
      }
      if (!this.areYouCreator(host, id)) {
        return this.YouAreNotOwnerErrorOutput;
      }

      if (
        payload.rating !== null &&
        (payload.rating < 1 || payload.rating > 5)
      ) {
        return {
          ok: false,
          error: "Rating must be between 1 and 5.",
        };
      } else {
        const updatedPodcast: Podcast = { ...podcast, ...payload };
        await this.podcastRepository.save(updatedPodcast);
        return { ok };
      }
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async getEpisodes(podcastId: number): Promise<EpisodesOutput> {
    const { podcast, ok, error } = await this.getPodcast(podcastId);
    if (!ok) {
      return { ok, error };
    }
    return {
      ok: true,
      episodes: podcast.episodes,
    };
  }

  async getEpisode({
    podcastId,
    episodeId,
  }: EpisodesSearchInput): Promise<GetEpisodeOutput> {
    const { episodes, ok, error } = await this.getEpisodes(podcastId);
    if (!ok) {
      return { ok, error };
    }
    const episode = episodes.find((episode) => episode.id === episodeId);
    if (!episode) {
      return {
        ok: false,
        error: `Episode with id ${episodeId} not found in podcast with id ${podcastId}`,
      };
    }
    return {
      ok: true,
      episode,
    };
  }

  async createEpisode({
    podcastId,
    title,
    category,
  }: CreateEpisodeInput): Promise<CreateEpisodeOutput> {
    try {
      const { podcast, ok, error } = await this.getPodcast(podcastId);
      if (!ok) {
        return { ok, error };
      }
      const newEpisode = this.episodeRepository.create({ title, category });
      newEpisode.podcast = podcast;
      const { id } = await this.episodeRepository.save(newEpisode);
      return {
        ok: true,
        id,
      };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async deleteEpisode(
    host: User,
    { podcastId, episodeId }: EpisodesSearchInput
  ): Promise<CoreOutput> {
    try {
      const { episode, error, ok } = await this.getEpisode({
        podcastId,
        episodeId,
      });

      if (!ok) {
        return { ok, error };
      }

      if (!this.areYouCreator(host, episodeId, true)) {
        return this.YouAreNotOwnerErrorOutput;
      }
      await this.episodeRepository.delete({ id: episode.id });
      return { ok: true };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }

  async updateEpisode(
    host: User,
    { podcastId, episodeId, ...rest }: UpdateEpisodeInput
  ): Promise<CoreOutput> {
    try {
      const { episode, ok, error } = await this.getEpisode({
        podcastId,
        episodeId,
      });
      if (!ok) {
        return { ok, error };
      }
      if (!this.areYouCreator(host, episodeId, true)) {
        return this.YouAreNotOwnerErrorOutput;
      }
      const updatedEpisode = { ...episode, ...rest };
      await this.episodeRepository.save(updatedEpisode);
      return { ok: true };
    } catch (e) {
      return this.InternalServerErrorOutput;
    }
  }
  // today assignment
  async searchPodcastByTitle({
    title,
    page,
    pageSize,
  }: SearchPodcastInput): Promise<SearchPodcastOutput> {
    try {
      // 비효율적???
      const query = await this.podcastRepository
        .createQueryBuilder("podcast")
        .leftJoinAndSelect("podcast.host", "host")
        .leftJoinAndSelect("podcast.episodes", "episodes")
        .where(
          `podcast.title ${
            process.env.NODE_ENV === "production" ? "ILIKE" : "LIKE"
          } :title`,
          { title: `%${title}%` }
        );

      const totalCount = await query.getCount();
      const totalPage = Math.ceil(totalCount / pageSize);
      const results = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();
      const currentCount = results.length;

      /*const [results, totalCount] = await this.podcastRepository.findAndCount({
        where: {
          title: ILike(`%${title}%`),
        },
        relations: ["host", "episodes"],
      });
      const totalPage = Math.ceil(totalCount / pageSize);
      const currentCount =
        page !== totalPage ? pageSize : totalCount % pageSize;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + currentCount;*/

      return {
        ok: true,
        currentPage: page,
        totalCount,
        totalPage,
        pageSize,
        currentCount,
        results,
        //results: results.slice(startIndex, endIndex),
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async reviewPodcast(
    reviewer: User,
    { podcastId, content, rating }: ReviewPodcastInput
  ): Promise<ReviewPodcastOutput> {
    try {
      const podcast = await this.podcastRepository.findOneOrFail(podcastId, {
        relations: ["reviews", "reviews.reviewer"],
      });

      if (
        podcast.reviews.every((review) => review.reviewerId !== reviewer.id)
      ) {
        await this.reviewRepository.save(
          this.reviewRepository.create({
            content,
            rating,
            reviewer,
            podcast,
          })
        );
      } else {
        throw Error("Already have wrotten review.");
      }

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async toggleSubscription(
    listener: User,
    { podcastId }: ToggleSubscriptionInput
  ): Promise<ToggleSubscriptionOutput> {
    try {
      const podcast = await this.podcastRepository.findOneOrFail(podcastId, {
        relations: ["listeners"],
      });
      let result;

      if (
        podcast.listeners.some((subscriber) => subscriber.id === listener.id)
      ) {
        podcast.listeners = podcast.listeners.filter(
          (subscriber) => subscriber.id !== listener.id
        );
        await this.podcastRepository.save(podcast);
        result = `Unsubscribed podcast: ${podcast.title}.`;
      } else {
        podcast.listeners.push(listener);
        await this.podcastRepository.save(podcast);
        result = `Subscribed podcast: ${podcast.title}.`;
      }
      return {
        ok: true,
        result,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async seeSubscriptions(
    listener: User,
    { page, pageSize }: SeeSubscriptionInput
  ): Promise<SeeSubscriptionOutput> {
    try {
      const totalCount = await this.podcastRepository.count();
      const totalPage = Math.ceil(totalCount / pageSize);
      const [subscriptions, count] = await this.podcastRepository
        .createQueryBuilder("podcast")
        .leftJoinAndSelect("podcast.listeners", "listeners")
        .where("listeners.id=:listenerId", { listenerId: listener.id })
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return {
        ok: true,
        subscriptions,
        currentCount: count,
        currentPage: page,
        totalPage,
        totalCount,
        pageSize,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async seePodcastReviews({
    podcastId,
    page,
    pageSize,
  }: SeePodcastReviewsInput): Promise<SeePodcastReviewsOutput> {
    try {
      const query = await this.reviewRepository
        .createQueryBuilder("reviews")
        .leftJoinAndSelect("reviews.podcast", "podcast")
        .where("podcast.id = :podcastId", { podcastId });
      const totalCount = await query.getCount();
      const totalPage = Math.ceil(totalCount / pageSize);
      const reviews = await query
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();
      const currentCount = reviews.length;

      return {
        ok: true,
        pageSize,
        totalCount,
        totalPage,
        currentCount,
        currentPage: page,
        reviews,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async markEpisodeAsPlayed(
    listener: User,
    { episodeId }: MarkEpisodeAsPlayedInput
  ): Promise<MarkEpisodeAsPlayedOutput> {
    try {
      const episode = await this.episodeRepository.findOneOrFail(episodeId, {
        relations: ["seenUser"],
      });
      let count;

      if (episode.seenUser.every((seenUser) => seenUser.id !== listener.id)) {
        episode.seenUser.push(listener);
        const updated = await this.episodeRepository.save(episode);
        count = updated.seenUser.length;

        return {
          ok: true,
          count,
        };
      } else {
        throw Error("Watched before");
      }
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  async seedPodcastAndEpisode({
    numPodcast,
    minEpisode,
    maxEpisode,
  }: SeedPodcastAndEpisodeInput): Promise<SeedPodcastAndEpisodeOutput> {
    try {
      const category = [
        "Book",
        "Design",
        "Fashion",
        "Food",
        "Careers",
        "Management",
        "Marketing",
        "Non-Profit",
        "Comedy",
        "Stand-up",
        "Courses",
        "Education",
        "Howto",
        "Language",
        "Fiction",
        "Drama",
        "History",
        "Health&Fitness",
        "Medicine",
        "Mental Health",
        "Sexuality",
        "Education for kids",
        "Parenting",
        "Music",
        "Animation",
        "Video Games",
        "Politics",
        "Tech",
        "Sports",
        "Science",
        "Nature",
        "Physics",
        "Social Science",
        "Baseball",
        "Basketball",
        "Film History",
        "Film Reviews",
        "Technology",
      ];
      const baseThumbUrl =
        "https://ubereats-challenge.s3.ap-northeast-2.amazonaws.com/";
      const hosts = await this.userRepository.find({
        where: { role: UserRole.Host },
      });
      if (hosts.length < 1) throw Error("No hosts. Cannot seed podcast");
      const listeners = await this.userRepository.find({
        where: { role: UserRole.Listener },
      });
      if (listeners.length < 1)
        throw Error("No Listeners. Cannot seed podcast");

      const episodes: Array<Episode> = [];
      for (let i = 0; i < numPodcast; i++) {
        const podcast = await this.podcastRepository.save(
          this.podcastRepository.create({
            host: faker.random.arrayElement(hosts),
            title: faker.lorem.words(faker.random.number({ min: 3, max: 10 })),
            category: faker.random.arrayElement(category),
            description: faker.lorem.paragraph(
              faker.random.number({ min: 4, max: 8 })
            ),
            thumbnail: `${baseThumbUrl}podcast${faker.random.number({
              min: 1,
              max: 30,
            })}.jpg`,
            listeners: faker.random.arrayElements(
              listeners,
              faker.random.number({ min: 1, max: 50 })
            ),
          })
        );

        const numEpisode = faker.random.number({
          min: minEpisode,
          max: maxEpisode,
        });
        for (let j = 0; j < numEpisode; j++) {
          await this.episodeRepository.save(
            this.episodeRepository.create({
              podcast,
              title: faker.lorem.words(
                faker.random.number({ min: 3, max: 10 })
              ),
              description: faker.lorem.paragraph(
                faker.random.number({ min: 4, max: 8 })
              ),
              category: faker.random.arrayElement(category),
              playLength: faker.random.number({ min: 30, max: 60 * 60 * 3 }),
              seenUser: faker.random.arrayElements(
                listeners,
                faker.random.number({ min: 1, max: 30 })
              ),
            })
          );
        }
      }

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }
}
