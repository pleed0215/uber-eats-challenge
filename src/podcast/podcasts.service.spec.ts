import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Episode } from './entities/episode.entity';
import { Podcast } from './entities/podcast.entity';

import { PodcastsService } from './podcasts.service';

export type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockedRepository = () => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const TEST_PODCAST: Podcast = {
  id: 1,
  title: 'TEST',
  category: 'TEST',
  rating: 0,
  episodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TEST_PODCAST_2: Podcast = {
  id: 2,
  title: 'TEST2',
  category: 'TEST2',
  rating: 0,
  episodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TEST_EPISODE: Episode = {
  id: 1,
  title: 'TEST',
  category: 'TEST',
  createdAt: new Date(),
  updatedAt: new Date(),
  podcast: TEST_PODCAST,
};

const TEST_EPISODE_2: Episode = {
  id: 22,
  title: 'TEST',
  category: 'TEST',
  createdAt: new Date(),
  updatedAt: new Date(),
  podcast: TEST_PODCAST_2,
};

const InternalServerErrorOutput = {
  ok: false,
  error: 'Internal server error occurred.',
};

describe('PodcastService', () => {
  let service: PodcastsService;

  let podcastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;

  // initializing testing values.
  TEST_PODCAST.episodes.push(TEST_EPISODE);
  TEST_PODCAST_2.episodes.push(TEST_EPISODE_2);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PodcastsService,
        {
          provide: getRepositoryToken(Podcast),
          useValue: mockedRepository(),
        },
        {
          provide: getRepositoryToken(Episode),
          useValue: mockedRepository(),
        },
      ],
    }).compile();

    service = module.get<PodcastsService>(PodcastsService);
    podcastRepository = module.get(getRepositoryToken(Podcast));
    episodeRepository = module.get(getRepositoryToken(Episode));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(podcastRepository).toBeDefined();
    expect(episodeRepository).toBeDefined();
  });

  describe('getAllPodcasts Test', () => {
    it('should success to return podcasts', async () => {
      podcastRepository.find.mockResolvedValueOnce([
        TEST_PODCAST,
        TEST_PODCAST_2,
      ]);
      const result = await service.getAllPodcasts();
      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        ok: true,
        podcasts: [TEST_PODCAST, TEST_PODCAST_2],
      });
    });

    it('should fail to return podcasts', async () => {
      podcastRepository.find.mockRejectedValueOnce(new Error('MockedError'));

      const result = await service.getAllPodcasts();
      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });

  describe('createPodcast Test', () => {
    it('should success to create Podcast', async () => {
      const createArgs = {
        title: TEST_PODCAST.title,
        category: TEST_PODCAST.category,
      };
      podcastRepository.create.mockReturnValueOnce(createArgs);
      podcastRepository.save.mockResolvedValueOnce(TEST_PODCAST);

      const result = await service.createPodcast(createArgs);

      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith(createArgs);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(createArgs);
      expect(result).toMatchObject({ ok: true, id: TEST_PODCAST.id });
    });

    it('should failed to create Podcast', async () => {
      const createArgs = {
        title: TEST_PODCAST.title,
        category: TEST_PODCAST.category,
      };
      podcastRepository.create.mockReturnValueOnce(createArgs);
      podcastRepository.save.mockRejectedValueOnce(new Error('TEST ERROR'));

      const result = await service.createPodcast(createArgs);
      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith(createArgs);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(createArgs);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });

  describe('getPodcast Testing', () => {
    it('should success to get podcast', async () => {
      const createArgs = TEST_PODCAST.id;
      const findOneArgs = [
        { id: TEST_PODCAST.id },
        { relations: ['episodes'] },
      ];
      podcastRepository.findOne.mockResolvedValueOnce(TEST_PODCAST);
      const result = await service.getPodcast(createArgs);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(...findOneArgs);
      expect(result).toMatchObject({ ok: true, podcast: TEST_PODCAST });
    });

    it('should fail to get podcast, because record not found', async () => {
      const createArgs = TEST_PODCAST.id;
      const findOneArgs = [
        { id: TEST_PODCAST.id },
        { relations: ['episodes'] },
      ];
      podcastRepository.findOne.mockResolvedValueOnce(null);
      const result = await service.getPodcast(createArgs);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(...findOneArgs);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });

    it('should fail to get podcast, because of error on findOne', async () => {
      const createArgs = TEST_PODCAST.id;
      const findOneArgs = [
        { id: TEST_PODCAST.id },
        { relations: ['episodes'] },
      ];
      podcastRepository.findOne.mockRejectedValueOnce(new Error('Test Error'));
      const result = await service.getPodcast(createArgs);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(...findOneArgs);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });

  describe('deletePodcast Testing', () => {
    it('should success to delete', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));
      const result = await service.deletePodcast(TEST_PODCAST.id);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ ok: true });
    });
    it('should fail becuase of deleting failed', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));
      podcastRepository.delete.mockRejectedValueOnce(new Error('Mocked Error'));
      const result = await service.deletePodcast(TEST_PODCAST.id);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });

    it('should fail to delete, because of getPodcast emitting error', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: false,
        error: `Podcast with id ${id} not found`,
      }));
      const result = await service.deletePodcast(TEST_PODCAST.id);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.delete).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });
  });

  describe('updatePodcast Testing', () => {
    it('should success to update Podcast', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));
      const payload = { rating: 3 };
      const result = await service.updatePodcast({
        id: TEST_PODCAST.id,
        payload,
      });
      const expectedArgs = { ...TEST_PODCAST, ...payload };

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(expectedArgs);
      expect(result).toMatchObject({ ok: true });
    });
    it('should fail to update Podcast, because of saving failed', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));
      const payload = { rating: 3 };
      podcastRepository.save.mockRejectedValueOnce(new Error('Mocked Error'));
      const result = await service.updatePodcast({
        id: TEST_PODCAST.id,
        payload,
      });
      const expectedArgs = { ...TEST_PODCAST, ...payload };

      expect(payload.rating).not.toBeNull();
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(expectedArgs);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
    it('should fail to update Podcast, due to invalid payload', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));
      const payload = { rating: 300 };
      const result = await service.updatePodcast({
        id: TEST_PODCAST.id,
        payload,
      });

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.save).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: 'Rating must be between 1 and 5.',
      });
    });
    it('should failed to update Podcast, becuase of getPodcast emitting error', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: false,
        error: `Podcast with id ${id} not found`,
      }));
      const payload = { rating: 3 };
      const result = await service.updatePodcast({
        id: TEST_PODCAST.id,
        payload,
      });

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(podcastRepository.save).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });
  });

  describe('getEpisodes Testing', () => {
    it('should success to get episodes', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));

      const result = await service.getEpisodes(TEST_PODCAST.id);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(result).toMatchObject({
        ok: true,
        episodes: [TEST_EPISODE],
      });
    });
    it('should failed to get episodes because of getPodcast emtting error', async () => {
      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: false,
        error: `Podcast with id ${id} not found`,
      }));

      const result = await service.getEpisodes(TEST_EPISODE.id);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });
  });

  describe('getEpisode Testing', () => {
    it('should succuess to get episode', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementationOnce(async id => ({
        ok: true,
        episodes: [TEST_EPISODE],
      }));

      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      };

      const result = await service.getEpisode(inputArgs);
      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(result).toMatchObject({ ok: true, episode: TEST_EPISODE });
    });
    it('should fail to get episode becuase of getEpisodes emtting error', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementationOnce(async id => ({
        ok: false,
        error: `Podcast with id ${id} not found`,
      }));

      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      };

      const result = await service.getEpisode(inputArgs);
      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });
    it('should fail to get episode, because of no episode found', async () => {
      jest.spyOn(service, 'getEpisodes').mockImplementationOnce(async id => ({
        ok: true,
        episodes: [TEST_EPISODE],
      }));

      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE_2.id,
      };

      const result = await service.getEpisode(inputArgs);
      expect(service.getEpisodes).toHaveBeenCalledTimes(1);
      expect(service.getEpisodes).toHaveBeenCalledWith(TEST_PODCAST.id);

      expect(result).toMatchObject({
        ok: false,
        error: `Episode with id ${inputArgs.episodeId} not found in podcast with id ${inputArgs.podcastId}`,
      });
    });
  });

  describe('createEpisode Testing', () => {
    it('should success to create Episode', async () => {
      const createArgs = {
        title: TEST_EPISODE.title,
        category: TEST_EPISODE.category,
      };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        ...createArgs,
      };
      const expectedSaveArgs = {
        ...createArgs,
        podcast: TEST_PODCAST,
      };

      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));

      episodeRepository.create.mockReturnValueOnce({ ...createArgs });
      episodeRepository.save.mockResolvedValueOnce(TEST_EPISODE);
      const result = await service.createEpisode(inputArgs);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(episodeRepository.create).toHaveBeenCalledTimes(1);
      expect(episodeRepository.create).toHaveBeenCalledWith(createArgs);
      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({
        ok: true,
        id: TEST_EPISODE.id,
      });
    });

    it('should fail to create Episode, because of getPodcast emitting error', async () => {
      const createArgs = {
        title: TEST_EPISODE.title,
        category: TEST_EPISODE.category,
      };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        ...createArgs,
      };

      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: false,
        error: `Podcast with id ${id} not found`,
      }));

      const result = await service.createEpisode(inputArgs);
      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(episodeRepository.create).toHaveBeenCalledTimes(0);
      expect(episodeRepository.save).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `Podcast with id ${TEST_PODCAST.id} not found`,
      });
    });

    it('should fail to create Episode, because of saving failed', async () => {
      const createArgs = {
        title: TEST_EPISODE.title,
        category: TEST_EPISODE.category,
      };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        ...createArgs,
      };
      const expectedSaveArgs = {
        ...createArgs,
        podcast: TEST_PODCAST,
      };

      jest.spyOn(service, 'getPodcast').mockImplementationOnce(async id => ({
        ok: true,
        podcast: TEST_PODCAST,
      }));

      episodeRepository.create.mockReturnValue({ ...createArgs });
      episodeRepository.save.mockRejectedValueOnce(new Error('Mocked Error'));
      const result = await service.createEpisode(inputArgs);

      expect(service.getPodcast).toHaveBeenCalledTimes(1);
      expect(service.getPodcast).toHaveBeenCalledWith(TEST_PODCAST.id);
      expect(episodeRepository.create).toHaveBeenCalledTimes(1);
      expect(episodeRepository.create).toHaveBeenCalledWith(createArgs);
      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });

  describe('deleteEpisode testing', () => {
    it('should success to delete Episode', async () => {
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: true,
          episode: TEST_EPISODE,
        }));

      const result = await service.deleteEpisode(inputArgs);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(inputArgs);
      expect(episodeRepository.delete).toHaveBeenCalledTimes(1);
      expect(episodeRepository.delete).toHaveBeenCalledWith({
        id: TEST_EPISODE.id,
      });
      expect(result).toMatchObject({ ok: true });
    });

    it('should fail to delete Episode, because of getEpisode emitting error', async () => {
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: false,
          error: `Episode with id ${episodeId} not found in podcast with id ${podcastId}`,
        }));

      const result = await service.deleteEpisode(inputArgs);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(inputArgs);
      expect(episodeRepository.delete).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `Episode with id ${inputArgs.episodeId} not found in podcast with id ${inputArgs.podcastId}`,
      });
    });
    it('should fail to delete Episode, because of deleting failed', async () => {
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: true,
          episode: TEST_EPISODE,
        }));

      episodeRepository.delete.mockRejectedValue(new Error('Mocked Error'));
      const result = await service.deleteEpisode(inputArgs);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith(inputArgs);
      expect(episodeRepository.delete).toHaveBeenCalledTimes(1);
      expect(episodeRepository.delete).toHaveBeenCalledWith({
        id: TEST_EPISODE.id,
      });
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });

  describe('updateEpisode testing', () => {
    it('should success to update', async () => {
      const updateArgs = { title: 'NowTesting' };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
        ...updateArgs,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: true,
          episode: TEST_EPISODE,
        }));

      const result = await service.updateEpisode(inputArgs);
      const expectedSaveArgs = {
        ...TEST_EPISODE,
        ...updateArgs,
      };

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      });
      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({ ok: true });
    });

    it('should failed to update, because of getEpisode emitting error', async () => {
      const updateArgs = { title: 'NowTesting' };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
        ...updateArgs,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: false,
          error: `Episode with id ${episodeId} not found in podcast with id ${podcastId}`,
        }));

      const result = await service.updateEpisode(inputArgs);

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      });
      expect(episodeRepository.save).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `Episode with id ${inputArgs.episodeId} not found in podcast with id ${inputArgs.podcastId}`,
      });
    });
    it('should fail to update, becuase of save failed', async () => {
      const updateArgs = { title: 'NowTesting' };
      const inputArgs = {
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
        ...updateArgs,
      };

      jest
        .spyOn(service, 'getEpisode')
        .mockImplementationOnce(async ({ podcastId, episodeId }) => ({
          ok: true,
          episode: TEST_EPISODE,
        }));

      episodeRepository.save.mockRejectedValueOnce(new Error('Mocked Error'));

      const result = await service.updateEpisode(inputArgs);
      const expectedSaveArgs = {
        ...TEST_EPISODE,
        ...updateArgs,
      };

      expect(service.getEpisode).toHaveBeenCalledTimes(1);
      expect(service.getEpisode).toHaveBeenCalledWith({
        podcastId: TEST_PODCAST.id,
        episodeId: TEST_EPISODE.id,
      });
      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject(InternalServerErrorOutput);
    });
  });
});
