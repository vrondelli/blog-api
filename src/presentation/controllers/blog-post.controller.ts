import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { GetAllBlogPostsUseCase } from '../../application/use-cases/get-all-blog-posts.use-case';
import { GetPostWithCommentsUseCase } from '../../application/use-cases/get-post-with-comments.use-case';
import { CreateBlogPostUseCase } from '../../application/use-cases/create-blog-post.use-case';
import { CreateCommentUseCase } from '../../application/use-cases/create-comment.use-case';
import { CreateBlogPostRequestDto } from '../dtos/create-blog-post-request.dto';
import { CreateCommentRequestDto } from '../dtos/create-comment-request.dto';
import { GetPostQueryDto } from '../dtos/get-post-query.dto';
import { BlogPostResponseDto } from '../dtos/blog-post-response.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { PostWithCommentsResponseDto } from '../dtos/post-with-comments-response.dto';
import { CreateBlogPostCommand } from '../../application/dtos/create-blog-post.dto';
import { CreateCommentCommand } from '../../application/dtos/create-comment.dto';
import {
  GetPostWithCommentsQuery,
  CommentSortOrder,
} from '../../application/dtos/get-post-with-comments.dto';
import { CustomValidationPipe } from '../../infrastructure/validation/custom-validation.pipe';
import { RateLimitGuard } from '../../infrastructure/guards/rate-limit.guard';
import {
  BlogPostMapper,
  CommentMapper,
  PostWithCommentsMapper,
} from '../mappers/response.mapper';

@ApiTags('blog-posts')
@Controller('api/posts')
export class BlogPostController {
  constructor(
    private readonly getAllBlogPostsUseCase: GetAllBlogPostsUseCase,
    private readonly getPostWithCommentsUseCase: GetPostWithCommentsUseCase,
    private readonly createBlogPostUseCase: CreateBlogPostUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all blog posts',
    description:
      'Retrieve a list of all blog posts ordered by creation date (newest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all blog posts',
    type: [BlogPostResponseDto],
  })
  async getAllPosts(): Promise<BlogPostResponseDto[]> {
    const posts = await this.getAllBlogPostsUseCase.execute();
    return BlogPostMapper.toDtoList(posts);
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @UsePipes(new CustomValidationPipe())
  @ApiOperation({
    summary: 'Create a new blog post',
    description: 'Create a new blog post with title and content',
  })
  @ApiBody({
    description: 'Blog post data',
    type: CreateBlogPostRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Blog post created successfully',
    type: BlogPostResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async createPost(
    @Body() dto: CreateBlogPostRequestDto,
  ): Promise<BlogPostResponseDto> {
    const command = new CreateBlogPostCommand(dto.title, dto.content);
    const post = await this.createBlogPostUseCase.execute(command);
    return BlogPostMapper.toDto(post);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a blog post by ID',
    description: 'Retrieve a specific blog post with optional comments',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the blog post',
    type: PostWithCommentsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Blog post not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
  })
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryDto: GetPostQueryDto,
  ): Promise<PostWithCommentsResponseDto> {
    const query = new GetPostWithCommentsQuery(
      id,
      queryDto.includeComments,
      queryDto.commentsLimit,
      queryDto.commentsSortOrder as CommentSortOrder,
      queryDto.commentsDepth,
      queryDto.commentsCursor,
    );

    const result = await this.getPostWithCommentsUseCase.execute(query);
    return PostWithCommentsMapper.toDto(result.post, result.comments);
  }

  @Post(':id/comments')
  @UseGuards(RateLimitGuard)
  @UsePipes(new CustomValidationPipe())
  @ApiOperation({
    summary: 'Add a comment to a blog post',
    description:
      'Create a new comment on a blog post. Can be a top-level comment or a reply.',
  })
  @ApiParam({
    name: 'id',
    description: 'Blog post ID',
    example: 123,
  })
  @ApiBody({
    description: 'Comment data',
    type: CreateCommentRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiNotFoundResponse({
    description: 'Blog post not found or invalid parent comment',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentRequestDto,
  ): Promise<CommentResponseDto> {
    const command = new CreateCommentCommand(
      dto.content,
      dto.author,
      id,
      dto.parentId,
    );
    const comment = await this.createCommentUseCase.execute(command);
    return CommentMapper.toDto(comment);
  }
}
