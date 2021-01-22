import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as request from "supertest";
import { getConnection, Repository } from "typeorm";
import { Podcast } from "src/podcast/entities/podcast.entity";
import { AppModule } from "./../src/app.module";
import { Episode } from "src/podcast/entities/episode.entity";
import { send } from "process";
import { User } from "src/users/entities/user.entity";

const GRAPHQL_ENDPOINT = "/graphql";

const testPodcast = {
  title: "test podcast",
  category: "test"
};

const testEpisode = {
  title: "test episode",
  category: "test"
};

const testUser = {
  email: "flynn@flynnpark.dev",
  password: "flynndev"
};

describe("App (e2e)", () => {
  let app: INestApplication;
  let podcastsRepository: Repository<Podcast>;
  let episodesRepository: Repository<Episode>;
  let usersRepository: Repository<User>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set("X-JWT", jwtToken).send({ query });

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    podcastsRepository = moduleFixture.get<Repository<Podcast>>(
      getRepositoryToken(Podcast)
    );
    episodesRepository = moduleFixture.get<Repository<Episode>>(
      getRepositoryToken(Episode)
    );
    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe("Podcasts Resolver", () => {
    describe("createPodcast", () => {
      it("should create a new podcast", () =>
        publicTest(`
            mutation {
              createPodcast(input: {
                title: "${testPodcast.title}",
                category: "${testPodcast.category}",
              }) {
                ok
                id
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createPodcast.ok).toBe(true);
            expect(res.body.data.createPodcast.id).toBe(1);
          }));
    });
    describe("getAllPodcasts", () => {
      let podcastIds: number[];
      beforeAll(async () => {
        const podcasts = await podcastsRepository.find();
        podcastIds = podcasts.map((podcast) => podcast.id);
      });
      it("should get all podcasts", () =>
        publicTest(`
{
              getAllPodcasts {
                ok
                podcasts {
                  id
                }
              }
            }`)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  getAllPodcasts: { ok, podcasts }
                }
              }
            } = res;
            const receivedPodcastIds = podcasts.map((podcast) => podcast.id);
            expect(ok).toBe(true);
            expect(receivedPodcastIds).toStrictEqual(podcastIds);
          }));
    });
    describe("getPodcast", () => {
      let podcastId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
      });
      it("should get a podcast", () =>
        publicTest(`
            {
              getPodcast(input: {id: ${podcastId}}) {
                ok
                podcast {
                  id
                }
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  getPodcast: {
                    ok,
                    podcast: { id }
                  }
                }
              }
            } = res;
            expect(ok).toBe(true);
            expect(id).toBe(podcastId);
          }));
      it("should fail get a podcast", () =>
        publicTest(`
          {
            getPodcast(input: {id: ${podcastId + 1}}) {
              ok
              error
              podcast {
                id
              }
            }
          }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  getPodcast: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${podcastId + 1} not found`);
          }));
    });
    describe("updatePodcast", () => {
      const rating = 3;
      let podcastId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
      });
      it("should success to update Podcast", () => {
        return publicTest(`
            mutation {
              updatePodcast(input: { id: ${podcastId}, payload: { rating: ${rating} } }) {
                ok
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updatePodcast: { ok }
                }
              }
            } = res;
            expect(ok).toBe(true);
          });
      });
      it("should failed to update Podcast, becuase of getPodcast emitting error", () => {
        const errorPodcastId = 1000;
        return publicTest(`
            mutation {
              updatePodcast(input: { id: ${errorPodcastId}, payload: { rating: ${rating} } }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updatePodcast: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${errorPodcastId} not found`);
          });
      });
      it("should fail to update Podcast, due to invalid payload", () => {
        const errorRating = 10;
        return publicTest(`
            mutation {
              updatePodcast(input: { id: ${podcastId}, payload: { rating: ${errorRating} } }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updatePodcast: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe("Rating must be between 1 and 5.");
          });
      });
    });
    describe("createEpisode", () => {
      let podcastId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
      });
      it("should success to create Episode", () => {
        return publicTest(`
            mutation {
              createEpisode(input: {
                podcastId: ${podcastId},
                title: "${testEpisode.title}",
                category: "${testEpisode.category}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createEpisode.ok).toBe(true);
          });
      });
      it("should fail to create Episode, because of getPodcast emitting error", () => {
        const errorPodcastId = 1000;
        return publicTest(`
            mutation {
              createEpisode(input: {
                podcastId: ${errorPodcastId},
                title: "${testEpisode.title}",
                category: "${testEpisode.category}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createEpisode.ok).toBe(false);
            expect(res.body.data.createEpisode.error).toBe(
              `Podcast with id ${errorPodcastId} not found`
            );
          });
      });
    });
    describe("getEpisodes", () => {
      let podcastId: number;
      let episodeIds: number[];
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
        const episodes = await episodesRepository.find({ podcast });
        episodeIds = episodes.map((episode) => episode.id);
      });
      it("should success to get episodes", () => {
        return publicTest(`
            {
              getEpisodes(input: { id: ${podcastId} }) {
                ok
                error
                episodes {
                  id
                }
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  getEpisodes: { ok, error, episodes }
                }
              }
            } = res;
            const receivedEpisodeIds = episodes.map((episode) => episode.id);
            expect(ok).toBe(true);
            expect(receivedEpisodeIds).toEqual(episodeIds);
          });
      });
      it("should failed to get episodes because of getPodcast emtting error", () => {
        const errorPodcastId = 1000;
        return publicTest(`
            {
              getEpisodes(input: { id: ${errorPodcastId} }) {
                ok
                error
                episodes {
                  id
                }
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  getEpisodes: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${errorPodcastId} not found`);
          });
      });
    });
    describe("updateEpisode", () => {
      const newTitle = "new title";
      let podcastId: number;
      let episodeId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
        const [episode] = await episodesRepository.find({ podcast });
        episodeId = episode.id;
      });
      it("should success to update", () => {
        return publicTest(`
            mutation {
              updateEpisode(input: {
                podcastId: ${podcastId},
                episodeId: ${episodeId},
                title: "${newTitle}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updateEpisode: { ok }
                }
              }
            } = res;
            expect(ok).toBe(true);
          });
      });
      it("should failed to update, because of podcast not found", () => {
        const errorPodcastId = 1000;
        return publicTest(`
            mutation {
              updateEpisode(input: {
                podcastId: ${errorPodcastId},
                episodeId: ${episodeId},
                title: "${newTitle}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updateEpisode: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${errorPodcastId} not found`);
          });
      });
      it("should failed to update, because of episode not found", () => {
        const errorEpisodeId = 1000;
        return publicTest(`
            mutation {
              updateEpisode(input: {
                podcastId: ${podcastId},
                episodeId: ${errorEpisodeId},
                title: "${newTitle}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  updateEpisode: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(
              `Episode with id ${errorEpisodeId} not found in podcast with id ${podcastId}`
            );
          });
      });
    });
    describe("deleteEpisode", () => {
      let podcastId: number;
      let episodeId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
        const [episode] = await episodesRepository.find({ podcast });
        episodeId = episode.id;
      });
      it("should success to delete Episode", () => {
        return publicTest(`
            mutation {
              deleteEpisode(input: { podcastId: ${podcastId}, episodeId: ${episodeId} }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  deleteEpisode: { ok }
                }
              }
            } = res;
            expect(ok).toBe(true);
          });
      });
      it("should fail to delete Episode, because of episode not found", () => {
        return publicTest(`
            mutation {
              deleteEpisode(input: { podcastId: ${podcastId}, episodeId: ${episodeId} }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  deleteEpisode: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(
              `Episode with id ${episodeId} not found in podcast with id ${podcastId}`
            );
          });
      });
      it("should fail to delete Episode, because of podcast not found", () => {
        const errorPodcastId = 1000;
        return publicTest(`
            mutation {
              deleteEpisode(input: { podcastId: ${errorPodcastId}, episodeId: ${episodeId} }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  deleteEpisode: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${errorPodcastId} not found`);
          });
      });
    });
    describe("deletePodcast", () => {
      let podcastId: number;
      beforeAll(async () => {
        const [podcast] = await podcastsRepository.find();
        podcastId = podcast.id;
      });
      it("should success to delete", () => {
        return publicTest(`
            mutation {
              deletePodcast(input: { id: ${podcastId} }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  deletePodcast: { ok }
                }
              }
            } = res;
            expect(ok).toBe(true);
          });
      });
      it("should fail to delete, because of podcast not found", () => {
        return publicTest(`
            mutation {
              deletePodcast(input: { id: ${podcastId} }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  deletePodcast: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe(`Podcast with id ${podcastId} not found`);
          });
      });
    });
  });
  describe("Users Resolver", () => {
    describe("createAccount", () => {
      it("should create a new account", () => {
        return publicTest(`
          mutation {
            createAccount(input: {
              email: "${testUser.email}",
              password: "${testUser.password}",
              role: Host
            }) {
              ok
              error
            }
          }
        `)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createAccount.ok).toBe(true);
            expect(res.body.data.createAccount.error).toBe(null);
          });
      });
      it("should fail if account already exists", () => {
        return publicTest(`
            mutation {
              createAccount(input: {
                email: "${testUser.email}",
                password: "${testUser.password}",
                role: Host
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createAccount.ok).toBe(false);
            expect(res.body.data.createAccount.error).toBe(
              "There is a user with that email already"
            );
          });
      });
    });
    describe("login", () => {
      it("should succuess to login", () => {
        return publicTest(`
          mutation {
            login(input: {
              email: "${testUser.email}",
              password: "${testUser.password}"
            }) {
              ok
              error
              token
            }
          }
        `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  login: { ok, token }
                }
              }
            } = res;
            expect(ok).toBe(true);
            expect(token).toEqual(expect.any(String));
            jwtToken = token;
          });
      });
      it("should fail if user not found", () => {
        const fakeEmail = "fake@fake.com";
        return publicTest(`
            mutation {
              login(input: {
                email: "${fakeEmail}",
                password: "${testUser.password}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  login: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe("User not found");
          });
      });
      it("should fail if wrong password", () => {
        const fakePassword = "fakePassword";
        return publicTest(`
            mutation {
              login(input: {
                email: "${testUser.email}",
                password: "${fakePassword}"
              }) {
                ok
                error
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  login: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe("Wrong password");
          });
      });
    });
    describe("me", () => {
      it("should find my profile", () => {
        return privateTest(`
            {
              me {
                email
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  me: { email }
                }
              }
            } = res;
            expect(email).toBe(testUser.email);
          });
      });
      it("should not allow logged out user", () => {
        return publicTest(`
            {
              me {
                email
              }
            }
          `)
          .expect(200)
          .expect((res) => {
            const {
              body: { errors }
            } = res;
            const [error] = errors;
            expect(error.message).toBe("Forbidden resource");
          });
      });
    });
    describe("seeProfile", () => {
      let userId: number;
      beforeAll(async () => {
        const [user] = await usersRepository.find();
        userId = user.id;
      });
      it("should see a user's profile", () => {
        return privateTest(`
          {
            seeProfile(userId: ${userId}) {
              ok
              user {
                id
              }
            }
          }
        `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  seeProfile: {
                    ok,
                    user: { id }
                  }
                }
              }
            } = res;
            expect(ok).toBe(true);
            expect(id).toBe(userId);
          });
      });
      it("should fail if user not found", () => {
        const fakeUserId = 1000;
        return privateTest(`
          {
            seeProfile(userId: ${fakeUserId}) {
              ok
              error
            }
          }`)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  seeProfile: { ok, error }
                }
              }
            } = res;
            expect(ok).toBe(false);
            expect(error).toBe("User Not Found");
          });
      });
      it("should not allow logged out user", () => {
        return publicTest(`
            {
              seeProfile(userId: ${userId}) {
                ok
                error
              }
            }`)
          .expect(200)
          .expect((res) => {
            const {
              body: { errors }
            } = res;
            const [error] = errors;
            expect(error.message).toBe("Forbidden resource");
          });
      });
    });
    describe("editProfile", () => {
      const updateArgs = {
        password: "updatePassword"
      };
      let userId: number;
      beforeAll(async () => {
        const [user] = await usersRepository.find();
        userId = user.id;
      });
      it("should success to update profile", () => {
        return privateTest(`
          mutation {
            editProfile(input: { password: "${updateArgs.password}" }) {
              ok
              error
            }
          }
        `)
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  editProfile: { ok }
                }
              }
            } = res;
            expect(ok).toBe(true);
          });
      });
    });
  });
});
