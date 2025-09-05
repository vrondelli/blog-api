import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
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

@Controller('api')
export class CommentsController {
  constructor(
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getRepliesUseCase: GetRepliesUseCase,
  ) {}

  @Get('posts/:postId/comments')
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
