import { join } from 'path';
import { PythonScriptExecutor } from 'src/commons/helpers/python-script-executor';
import { SqlTranspiler } from '../interfaces/sql-transpiler.interface';

export class PythonSqlTranspiler implements SqlTranspiler {
  private readonly pythonExecutor = new PythonScriptExecutor();

  async toTrino(sql: string): Promise<{ result?: string; error?: string }> {
    const scriptPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'scripts',
      'sqlglot_runner.py',
    );

    return this.pythonExecutor.execute(scriptPath, { query: sql });
  }
}
