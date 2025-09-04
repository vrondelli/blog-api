import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2ETestSetup } from '../setup/e2e-setup';

describe('Blog API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await E2ETestSetup.getApp();
  });

  beforeEach(async () => {
    // Reset database before each test
    await E2ETestSetup.resetDatabase();
  });

  describe('Blog Posts', () => {
    it('should create a blog post', async () => {
      const createPostDto = {
        title: 'Test Blog Post',
        content: 'This is a test blog post content.',
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send(createPostDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: createPostDto.title,
        content: createPostDto.content,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should get all blog posts', async () => {
      // Create test posts
      const post1 = { title: 'Post 1', content: 'Content 1' };
      const post2 = { title: 'Post 2', content: 'Content 2' };

      await request(app.getHttpServer()).post('/api/posts').send(post1);
      await request(app.getHttpServer()).post('/api/posts').send(post2);

      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        content: expect.any(String),
      });
    });

    it('should get a blog post by id', async () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send(createPostDto);

      const postId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        post: {
          id: postId,
          title: createPostDto.title,
          content: createPostDto.content,
        },
        // comments will be null when includeComments is false
      });
    });

    it('should get a blog post with comments', async () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send(createPostDto);

      const postId = createResponse.body.id;

      // Add a comment
      await request(app.getHttpServer())
        .post(`/api/posts/${postId}/comments`)
        .send({
          content: 'Test comment',
          author: 'Test Author',
        });

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .query({ includeComments: true })
        .expect(200);

      expect(response.body).toMatchObject({
        post: {
          id: postId,
          title: createPostDto.title,
        },
        comments: {
          data: expect.arrayContaining([
            expect.objectContaining({
              content: 'Test comment',
              author: 'Test Author',
            }),
          ]),
          total: 1,
          page: 1,
        },
      });
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer()).get('/api/posts/999999').expect(404);
    });

    it('should validate required fields when creating post', async () => {
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/posts')
        .send({ title: 'Only Title' })
        .expect(400);
    });
  });

  describe('Comments', () => {
    let testPostId: number;

    beforeEach(async () => {
      const createPostResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Comments',
          content: 'Test Content',
        });
      testPostId = createPostResponse.body.id;
    });

    it('should create a comment', async () => {
      const createCommentDto = {
        content: 'This is a test comment',
        author: 'Test Author',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send(createCommentDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        content: createCommentDto.content,
        author: createCommentDto.author,
        blogPostId: testPostId,
        // parentId might be null or undefined for root comments
      });
    });

    it('should create a reply to comment', async () => {
      // Create parent comment
      const parentComment = await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({
          content: 'Parent comment',
          author: 'Parent Author',
        });

      const parentCommentId = parentComment.body.id;

      // Create reply
      const replyDto = {
        content: 'This is a reply',
        author: 'Reply Author',
        parentId: parentCommentId,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send(replyDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        content: replyDto.content,
        author: replyDto.author,
        blogPostId: testPostId,
        parentId: parentCommentId,
      });
    });

    it('should get comments for a post', async () => {
      // Create test comments
      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({ content: 'Comment 1', author: 'Author 1' });

      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({ content: 'Comment 2', author: 'Author 2' });

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testPostId}/comments`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ content: 'Comment 1' }),
          expect.objectContaining({ content: 'Comment 2' }),
        ]),
        total: 2,
        page: 1,
      });
    });

    it('should get replies for a comment', async () => {
      // Create parent comment
      const parentComment = await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({ content: 'Parent comment', author: 'Parent Author' });

      const parentCommentId = parentComment.body.id;

      // Create replies
      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({
          content: 'Reply 1',
          author: 'Author 1',
          parentId: parentCommentId,
        });

      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({
          content: 'Reply 2',
          author: 'Author 2',
          parentId: parentCommentId,
        });

      const response = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ content: 'Reply 1' }),
          expect.objectContaining({ content: 'Reply 2' }),
        ]),
        total: 2,
      });
    });

    it('should validate required fields when creating comment', async () => {
      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .post(`/api/posts/${testPostId}/comments`)
        .send({ content: 'Only content' })
        .expect(400);
    });

    it('should return 404 when creating comment for non-existent post', async () => {
      await request(app.getHttpServer())
        .post('/api/posts/999999/comments')
        .send({
          content: 'Test comment',
          author: 'Test Author',
        })
        .expect(404);
    });
  });

  describe('Comment Pagination and Sorting', () => {
    let testPostId: number;

    beforeEach(async () => {
      const createPostResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Pagination',
          content: 'Test Content',
        });
      testPostId = createPostResponse.body.id;

      // Create multiple comments for testing pagination
      for (let i = 1; i <= 15; i++) {
        await request(app.getHttpServer())
          .post(`/api/posts/${testPostId}/comments`)
          .send({
            content: `Comment ${i}`,
            author: `Author ${i}`,
          });
      }
    });

    it('should paginate comments', async () => {
      const page1 = await request(app.getHttpServer())
        .get(`/api/posts/${testPostId}/comments`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(page1.body.data).toHaveLength(5);
      expect(page1.body.total).toBe(15);
      expect(page1.body.page).toBe(1);
      expect(page1.body.totalPages).toBe(3);
      expect(page1.body.hasNext).toBe(true);
      expect(page1.body.hasPrev).toBe(false);

      const page2 = await request(app.getHttpServer())
        .get(`/api/posts/${testPostId}/comments`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(page2.body.data).toHaveLength(5);
      expect(page2.body.page).toBe(2);
      expect(page2.body.hasNext).toBe(true);
      expect(page2.body.hasPrev).toBe(true);
    });

    it('should include comments in post response with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testPostId}`)
        .query({
          includeComments: true,
          commentsLimit: 5,
          commentsPage: 1,
        })
        .expect(200);

      expect(response.body.comments.data).toHaveLength(5);
      expect(response.body.comments.total).toBe(15);
    });
  });
});
