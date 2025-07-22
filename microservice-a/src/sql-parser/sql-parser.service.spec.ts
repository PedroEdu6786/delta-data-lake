import { Test, TestingModule } from '@nestjs/testing';
import { SqlParserService } from './sql-parser.service';

describe('SqlParserService', () => {
  let service: SqlParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqlParserService],
    }).compile();

    service = module.get<SqlParserService>(SqlParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
