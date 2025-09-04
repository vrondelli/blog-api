import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.use-case';
import { GetRepliesUseCase } from '../../application/use-cases/get-replies.use-case';
import {
  GetCommentsQuery,
  GetRepliesQuery,
} from '../../application/dtos/get-comments.dto';
import { CommentSortOrder } from '../../domain/repositories/comment.repository';

@Controller('api')
export class CommentsController {
  constructor(
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getRepliesUseCase: GetRepliesUseCase,
  ) {}

  @Get('posts/:postId/comments')
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortOrder') sortOrder?: CommentSortOrder,
  ) {
    const query = new GetCommentsQuery(postId, page, limit, sortOrder);
    return this.getCommentsUseCase.execute(query);
  }

  @Get('comments/:commentId/replies')
  async getReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Query('sortOrder') sortOrder?: CommentSortOrder,
  ) {
    const query = new GetRepliesQuery(commentId, page, limit, sortOrder);
    return this.getRepliesUseCase.execute(query);
  }
}
