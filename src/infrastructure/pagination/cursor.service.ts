import { Injectable } from '@nestjs/common';

export interface CursorData {
  createdAt: Date;
  id: number;
}

@Injectable()
export class CursorService {
  /**
   * Encode cursor data to an opaque string
   */
  encodeCursor(data: CursorData): string {
    const payload = {
      createdAt: data.createdAt.toISOString(),
      id: data.id,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Decode cursor string back to cursor data
   */
  decodeCursor(cursor: string): CursorData | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const payload: { createdAt: string; id: number } = JSON.parse(
        decoded,
      ) as { createdAt: string; id: number };

      return {
        createdAt: new Date(payload.createdAt),
        id: payload.id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Validate cursor format
   */
  isValidCursor(cursor: string): boolean {
    return this.decodeCursor(cursor) !== null;
  }
}
