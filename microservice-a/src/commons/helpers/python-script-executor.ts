import { spawn } from 'child_process';
import { join } from 'path';

export interface PythonScriptResult {
  result?: any;
  error?: string;
}

export class PythonScriptExecutor {
  private readonly pythonPath: string;

  constructor(venvPath?: string) {
    this.pythonPath =
      venvPath ??
      join(__dirname, '..', '..', '..', 'scripts', '.venv', 'bin', 'python');
  }

  async execute(scriptPath: string, input?: any): Promise<PythonScriptResult> {
    const pyProcess = spawn(this.pythonPath, [scriptPath]);

    const outputChunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    pyProcess.stdout.on('data', (data: Buffer) => outputChunks.push(data));
    pyProcess.stderr.on('data', (data: Buffer) => errorChunks.push(data));

    if (input !== undefined) {
      pyProcess.stdin.write(JSON.stringify(input));
    }
    pyProcess.stdin.end();

    return new Promise((resolve) => {
      pyProcess.on('close', (code) => {
        const stdout = Buffer.concat(outputChunks).toString();
        const stderr = Buffer.concat(errorChunks).toString();

        if (stderr) console.warn('Python stderr:', stderr);

        if (code !== 0) {
          return resolve({ error: `Python script exited with code ${code}` });
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch {
          resolve({ error: 'Failed to parse python output' });
        }
      });

      pyProcess.on('error', (err) => {
        resolve({ error: `Failed to spawn python process: ${err.message}` });
      });
    });
  }
}
