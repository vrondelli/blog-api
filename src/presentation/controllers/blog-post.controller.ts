import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  DefaultValuePipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { GetAllBlogPostsUseCase } from '../../application/use-cases/get-all-blog-posts.use-case';
import { GetPostWithCommentsUseCase } from '../../application/use-cases/get-post-with-comments.use-case';
import { CreateBlogPostUseCase } from '../../application/use-cases/create-blog-post.use-case';
import { CreateCommentUseCase } from '../../application/use-cases/create-comment.use-case';
import { CreateBlogPostRequestDto } from '../dtos/create-blog-post-request.dto';
import { CreateCommentRequestDto } from '../dtos/create-comment-request.dto';
import { CreateBlogPostCommand } from '../../application/dtos/create-blog-post.dto';
import { CreateCommentCommand } from '../../application/dtos/create-comment.dto';
import {
  GetPostWithCommentsQuery,
  CommentSortOrder,
} from '../../application/dtos/get-post-with-comments.dto';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { CustomValidationPipe } from '../../infrastructure/validation/custom-validation.pipe';
import { RateLimitGuard } from '../../infrastructure/guards/rate-limit.guard';

@Controller('api/posts')
export class BlogPostController {
  constructor(
    private readonly getAllBlogPostsUseCase: GetAllBlogPostsUseCase,
    private readonly getPostWithCommentsUseCase: GetPostWithCommentsUseCase,
    private readonly createBlogPostUseCase: CreateBlogPostUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
  ) {}

  @Get()
  async getAllPosts(): Promise<BlogPost[]> {
    return this.getAllBlogPostsUseCase.execute();
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @UsePipes(new CustomValidationPipe())
  async createPost(@Body() dto: CreateBlogPostRequestDto): Promise<BlogPost> {
    const command = new CreateBlogPostCommand(dto.title, dto.content);
    return this.createBlogPostUseCase.execute(command);
  }

  @Get(':id')
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeComments', new DefaultValuePipe(false), ParseBoolPipe)
    includeComments?: boolean,
    @Query('commentsLimit', new DefaultValuePipe(10), ParseIntPipe)
    commentsLimit?: number,
    @Query('commentsPage', new DefaultValuePipe(1), ParseIntPipe)
    commentsPage?: number,
    @Query('commentsSortOrder') commentsSortOrder?: CommentSortOrder,
  ) {
    const query = new GetPostWithCommentsQuery(
      id,
      includeComments,
      commentsLimit,
      commentsPage,
      commentsSortOrder,
    );

    return this.getPostWithCommentsUseCase.execute(query);
  }

  @Post(':id/comments')
  @UseGuards(RateLimitGuard)
  @UsePipes(new CustomValidationPipe())
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentRequestDto,
  ): Promise<Comment> {
    const command = new CreateCommentCommand(
      dto.content,
      dto.author,
      id,
      dto.parentId,
    );
    return this.createCommentUseCase.execute(command);
  }
}
