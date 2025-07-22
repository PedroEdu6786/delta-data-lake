import { Test, TestingModule } from '@nestjs/testing';
import { AthenaQueryEngineService } from './athena-query-engine.service';

describe('AthenaQueryEngineService', () => {
  let service: AthenaQueryEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AthenaQueryEngineService],
    }).compile();

    service = module.get<AthenaQueryEngineService>(AthenaQueryEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
