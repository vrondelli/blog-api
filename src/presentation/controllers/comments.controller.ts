import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.use-case';
import { GetRepliesUseCase } from '../../application/use-cases/get-replies.use-case';
import {
  GetCommentsQuery,
  GetRepliesQuery,
} from '../../application/dtos/get-comments.dto';
import {
  GetCommentsRequestDto,
  GetRepliesRequestDto,
} from '../dtos/get-comments-request.dto';
import { CommentSortOrder } from '../../domain/repositories/comment.repository';
import { PaginatedCommentsDto } from '../dtos/post-with-comments-response.dto';

@ApiTags('Comments')
@Controller('api')
export class CommentsController {
  constructor(
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getRepliesUseCase: GetRepliesUseCase,
  ) {}

  @Get('posts/:postId/comments')
  @ApiTags('Blog Post Comments')
  @ApiOperation({
    summary: 'Get comments for a blog post',
    description:
      'Retrieve paginated comments for a specific blog post with optional filtering and sorting. This endpoint returns top-level comments for a post.',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the blog post',
    type: 'integer',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return per page',
    required: false,
    type: 'integer',
    example: 10,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order for comments',
    required: false,
    enum: CommentSortOrder,
    enumName: 'CommentSortOrder',
    example: CommentSortOrder.MOST_RECENT,
  })
  @ApiQuery({
    name: 'depth',
    description: 'Maximum depth of nested replies to include',
    required: false,
    type: 'integer',
    example: 2,
  })
  @ApiQuery({
    name: 'cursor',
    description: 'Cursor for pagination',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: PaginatedCommentsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Blog post not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() requestDto: GetCommentsRequestDto,
  ) {
    const query = new GetCommentsQuery(
      postId,
      requestDto.limit || 10,
      requestDto.sortOrder,
      requestDto.depth ?? 2,
      requestDto.cursor,
    );
    return this.getCommentsUseCase.execute(query);
  }

  @Get('comments/:commentId/replies')
  @ApiTags('Comment Replies')
  @ApiOperation({
    summary: 'Get replies to a specific comment',
    description:
      'Retrieve paginated replies (nested comments) for a specific parent comment. This endpoint is for fetching replies to an existing comment.',
  })
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the parent comment',
    type: 'integer',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of replies to return per page',
    required: false,
    type: 'integer',
    example: 5,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order for replies',
    required: false,
    enum: CommentSortOrder,
    enumName: 'CommentSortOrder',
    example: CommentSortOrder.MOST_RECENT,
  })
  @ApiQuery({
    name: 'depth',
    description: 'Maximum depth of nested replies to include',
    required: false,
    type: 'integer',
    example: 2,
  })
  @ApiQuery({
    name: 'cursor',
    description: 'Cursor for pagination',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Replies retrieved successfully',
    type: PaginatedCommentsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Parent comment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async getReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() requestDto: GetRepliesRequestDto,
  ) {
    const query = new GetRepliesQuery(
      commentId,
      requestDto.limit || 5,
      requestDto.sortOrder,
      requestDto.depth ?? 2,
      requestDto.cursor,
    );
    return this.getRepliesUseCase.execute(query);
  }
}
