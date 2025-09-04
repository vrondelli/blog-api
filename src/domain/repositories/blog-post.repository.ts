import { BlogPost } from '../entities/blog-post.entity';

export abstract class BlogPostRepository {
  abstract findAll(): Promise<BlogPost[]>;
  abstract findById(id: number): Promise<BlogPost | null>;
  abstract create(title: string, content: string): Promise<BlogPost>;
  abstract update(
    id: number,
    title?: string,
    content?: string,
  ): Promise<BlogPost | null>;
  abstract delete(id: number): Promise<boolean>;
}
