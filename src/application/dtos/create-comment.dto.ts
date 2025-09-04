// Application layer DTO - used for use case boundaries
export class CreateCommentCommand {
  constructor(
    public readonly content: string,
    public readonly author: string,
    public readonly blogPostId: number,
    public readonly parentId?: number,
  ) {}
}
