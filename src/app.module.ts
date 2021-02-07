import { Module, RequestMethod, MiddlewareConsumer } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { PodcastsModule } from "./podcast/podcasts.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Podcast } from "./podcast/entities/podcast.entity";
import { Episode } from "./podcast/entities/episode.entity";
import { User } from "./users/entities/user.entity";
import { UsersModule } from "./users/users.module";
import { JwtModule } from "./jwt/jwt.module";
import { JwtMiddleware } from "./jwt/jwt.middleware";
import { AuthModule } from "./auth/auth.module";
import { Review } from "./podcast/entities/review.entity";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...(process.env.NODE_ENV === "production"
        ? {
            //type: "postgres",
            //...(process.env.DATABASE_URL
            type: "mariadb",
            ...(process.env.JAWSDB_MARIA_URL
              ? {
                  url: process.env.JAWSDB_MARIA_URL,
                  ssl: { rejectUnauthorized: false },
                }
              : {
                  database: process.env.DB_NAME,
                  host: process.env.DB_HOST,
                  username: process.env.DB_USER,
                  password: process.env.DB_PASSWORD,
                  port: +process.env.DB_PORT,
                  ssl: { rejectUnauthorized: false },
                }),
          }
        : { type: "sqlite", database: "db.sqlite3" }),
      synchronize: true,
      logging: process.env.NODE_ENV !== "production",
      entities: [Podcast, Episode, User, Review],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }) => {
        return { user: req["user"] };
      },
      playground: true,
      introspection: true,
    }),
    JwtModule.forRoot({
      privateKey: "8mMJe5dMGORyoRPLvngA8U4aLTF3WasX",
    }),
    PodcastsModule,
    UsersModule,
    AuthModule,
    UploadsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes({
      path: "/graphql",
      method: RequestMethod.POST,
    });
  }
}
