import { Module } from '@nestjs/common';

@Module({
  // Domain layer should not have any providers as it contains only interfaces and entities
  // The entities and repository interfaces are imported directly where needed
})
export class DomainModule {}
