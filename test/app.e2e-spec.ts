import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common'
import { PrismaService } from '../src/prisma/prisma.service'
import * as pactum from 'pactum'
import { AuthDto } from '../src/auth/dto'
import { EditUserDto } from '../src/user/dto'
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from '../src/bookmark/dto'

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true }),
    )
    await app.init()
    await app.listen(3333)
    prisma = await app.get(PrismaService)

    await prisma.cleanDb()
    pactum.request.setBaseUrl(
      'http://localhost:3333',
    )
  })
  afterAll(() => {
    app.close()
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'evgen@gmail.com',
      password: '123',
    }
    describe('Signup', () => {
      it('should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })
      it('should throw 400 status when email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400)
      })
      it('should throw 400 status when password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.email })
          .expectStatus(400)
      })
      it('should throw 400 status when body is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400)
      })
    })
    describe('Signin', () => {
      it('should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })
    })
  })
  describe('User', () => {
    describe('Get me', () => {
      it('should return current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
      })
    })
    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Evgeny',
          lastName: 'Levenko',
          email: 'Evgen@gmail.com',
        }
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
      })
    })
  })
  describe('Bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('should return bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([])
      })
    })
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'http://fake.html',
      }
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    })
    describe('Get bookmarks', () => {
      it('should return bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
      })
    })
    describe('Get bookmark by id', () => {
      it('should return bookmarks by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
      })
    })
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'New title',
      }
      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
      })
    })
    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .inspect()
      })
    })
  })
})
