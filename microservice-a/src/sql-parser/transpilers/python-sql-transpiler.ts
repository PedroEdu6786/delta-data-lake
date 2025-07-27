import { Injectable } from '@nestjs/common';
import { PythonScriptExecutor } from '../../commons/helpers/python-script-executor';
import { SqlTranspiler } from '../interfaces/sql-transpiler.interface';

@Injectable()
export class PythonSqlTranspiler implements SqlTranspiler {
  private readonly pythonExecutor = new PythonScriptExecutor();
  private readonly dialect = 'trino';

  async transpile(sql: string): Promise<{ result?: string; error?: string }> {
    const scriptPath = ['scripts/sqlglot_runner.py'];
    return this.pythonExecutor.execute(scriptPath, {
      query: sql,
      target: this.dialect,
    });
  }
}
