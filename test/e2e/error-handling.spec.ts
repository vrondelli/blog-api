/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2ETestSetup } from '../setup/e2e-setup';

describe('Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await E2ETestSetup.getApp();
  });

  beforeEach(async () => {
    await E2ETestSetup.resetDatabase();
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid blog post data', async () => {
      const invalidData = {
        title: '', // Too short
        content: 'Short', // Too short
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        message: 'The request data is invalid',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Title must be at least 5 characters'),
          expect.stringContaining('Content must be at least 10 characters'),
        ]),
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.path).toBe('/api/posts');
    });

    it('should return 400 for blog post with invalid characters', async () => {
      const invalidData = {
        title: 'Invalid <script>alert("xss")</script> Title',
        content: 'Valid content that is long enough to pass validation',
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Title contains invalid characters'),
        ]),
      });
    });

    it('should return 400 for blog post title too long', async () => {
      const invalidData = {
        title: 'a'.repeat(201), // Too long
        content: 'Valid content that is long enough to pass validation',
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Title cannot exceed 200 characters'),
        ]),
      });
    });

    it('should return 400 for invalid comment data', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const invalidComment = {
        content: '', // Empty content
        author: 'A', // Too short
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Content is required'),
          expect.stringContaining('Author name must be at least 2 characters'),
        ]),
      });
    });

    it('should return 400 for comment with invalid author characters', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const invalidComment = {
        content: 'Valid comment content',
        author: 'Invalid@Author!Name#',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Author name contains invalid characters'),
        ]),
      });
    });

    it('should return 400 for extra fields in request', async () => {
      const invalidData = {
        title: 'Valid Title',
        content: 'Valid content that is long enough to pass validation',
        extraField: 'This should not be allowed',
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
      });
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent blog post', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Blog Post Not Found',
        message: 'Blog post with ID 99999 was not found',
        statusCode: 404,
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.path).toBe('/api/posts/99999');
    });

    it('should return 400 for comment with invalid parent ID', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const invalidComment = {
        content: 'Valid comment content',
        author: 'Valid Author',
        parentId: 99999, // Non-existent parent
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid Comment Parent',
        message:
          'Parent comment with ID 99999 does not exist or cannot be used as a parent',
        statusCode: 400,
      });
    });

    it('should return 404 for comment on non-existent blog post', async () => {
      const validComment = {
        content: 'Valid comment content',
        author: 'Valid Author',
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts/99999/comments')
        .send(validComment)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Blog Post Not Found',
        message: 'Blog post with ID 99999 was not found',
        statusCode: 404,
      });
    });
  });

  describe('Type Validation Errors', () => {
    it('should return 400 for non-numeric post ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts/not-a-number')
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: expect.any(String),
        message: expect.any(String),
      });
    });

    it('should return 400 for invalid parentId type', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const invalidComment = {
        content: 'Valid comment content',
        author: 'Valid Author',
        parentId: 'not-a-number',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Parent ID must be an integer'),
        ]),
      });
    });

    it('should return 400 for negative parentId', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const invalidComment = {
        content: 'Valid comment content',
        author: 'Valid Author',
        parentId: -1,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Parent ID must be a positive integer'),
        ]),
      });
    });
  });

  describe('Cross-Post Comment Validation', () => {
    it('should return 400 when trying to reply to comment from different post', async () => {
      // Create two blog posts
      const post1Response = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'First Post',
          content: 'Content of the first post that is long enough',
        })
        .expect(201);

      const post2Response = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Second Post',
          content: 'Content of the second post that is long enough',
        })
        .expect(201);

      // Create a comment on the first post
      const commentResponse = await request(app.getHttpServer())
        .post(`/api/posts/${post1Response.body.id}/comments`)
        .send({
          content: 'Comment on first post',
          author: 'Test Author',
        })
        .expect(201);

      // Try to create a reply on the second post that references the comment from the first post
      const invalidReply = {
        content: 'This should not work',
        author: 'Test Author',
        parentId: commentResponse.body.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${post2Response.body.id}/comments`)
        .send(invalidReply)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid Comment Parent',
        message: expect.stringContaining(
          'does not exist or cannot be used as a parent',
        ),
        statusCode: 400,
      });
    });
  });

  describe('Content Length Validation', () => {
    it('should reject blog post content that is too long', async () => {
      const tooLongContent = 'a'.repeat(50001);

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Title',
          content: tooLongContent,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Content cannot exceed 50,000 characters'),
        ]),
      });
    });

    it('should reject comment content that is too long', async () => {
      // First create a valid blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Valid Post Title',
          content: 'Valid post content that is long enough',
        })
        .expect(201);

      const tooLongComment = 'a'.repeat(5001);

      const response = await request(app.getHttpServer())
        .post(`/api/posts/${postResponse.body.id}/comments`)
        .send({
          content: tooLongComment,
          author: 'Valid Author',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation Failed',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.stringContaining('Content cannot exceed 5,000 characters'),
        ]),
      });
    });
  });
});
