// Application layer DTO - used for use case boundaries
export class CreateBlogPostCommand {
  constructor(
    public readonly title: string,
    public readonly content: string,
  ) {}
}
