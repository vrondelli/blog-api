import { config } from 'dotenv';
import { join } from 'path';

export default async (): Promise<void> => {
  // Load test environment variables
  config({ path: join(__dirname, '..', '.env.test') });
};
