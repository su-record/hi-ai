// Python code parser utility for v1.3
// Uses Python's ast module via child_process

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface PythonSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'import';
  line: number;
  column: number;
  endLine?: number;
  docstring?: string;
}

export interface PythonComplexity {
  cyclomaticComplexity: number;
  functions: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
  classes: Array<{
    name: string;
    methods: number;
    line: number;
  }>;
}

export class PythonParser {
  private static pythonScript = `
import ast
import sys
import json

def analyze_code(code):
    try:
        tree = ast.parse(code)
        symbols = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'function',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.ClassDef):
                symbols.append({
                    'name': node.name,
                    'kind': 'class',
                    'line': node.lineno,
                    'column': node.col_offset,
                    'endLine': node.end_lineno,
                    'docstring': ast.get_docstring(node)
                })
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        symbols.append({
                            'name': target.id,
                            'kind': 'variable',
                            'line': node.lineno,
                            'column': node.col_offset
                        })
            elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    symbols.append({
                        'name': alias.name,
                        'kind': 'import',
                        'line': node.lineno,
                        'column': node.col_offset
                    })

        return {'success': True, 'symbols': symbols}
    except SyntaxError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def calculate_complexity(code):
    try:
        tree = ast.parse(code)

        def cyclomatic_complexity(node):
            complexity = 1
            for child in ast.walk(node):
                if isinstance(child, (ast.If, ast.For, ast.While, ast.And, ast.Or, ast.ExceptHandler)):
                    complexity += 1
                elif isinstance(child, ast.BoolOp):
                    complexity += len(child.values) - 1
            return complexity

        functions = []
        classes = []
        total_complexity = 1

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_complexity = cyclomatic_complexity(node)
                functions.append({
                    'name': node.name,
                    'complexity': func_complexity,
                    'line': node.lineno
                })
                total_complexity += func_complexity
            elif isinstance(node, ast.ClassDef):
                method_count = sum(1 for n in node.body if isinstance(n, ast.FunctionDef))
                classes.append({
                    'name': node.name,
                    'methods': method_count,
                    'line': node.lineno
                })

        return {
            'success': True,
            'cyclomaticComplexity': total_complexity,
            'functions': functions,
            'classes': classes
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    code = sys.stdin.read()
    action = sys.argv[1] if len(sys.argv) > 1 else 'symbols'

    if action == 'symbols':
        result = analyze_code(code)
    elif action == 'complexity':
        result = calculate_complexity(code)
    else:
        result = {'success': False, 'error': 'Unknown action'}

    print(json.dumps(result))
`;

  public static async findSymbols(code: string): Promise<PythonSymbol[]> {
    let scriptPath: string | null = null;
    let codePath: string | null = null;

    try {
      // Write Python script to temp file
      scriptPath = path.join(os.tmpdir(), `hi-ai-parser-${Date.now()}-${process.pid}.py`);
      await writeFile(scriptPath, this.pythonScript);

      // Write code to temp file
      codePath = path.join(os.tmpdir(), `hi-ai-code-${Date.now()}-${process.pid}.py`);
      await writeFile(codePath, code);

      // Execute Python script
      const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" symbols < "${codePath}"`, {
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.error('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || 'Python parsing failed');
      }

      return result.symbols || [];
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error('Python 3 not found. Please install Python 3 to analyze Python code.');
      }
      throw error;
    } finally {
      // Always cleanup temp files, even on error
      if (scriptPath) {
        await unlink(scriptPath).catch(() => {});
      }
      if (codePath) {
        await unlink(codePath).catch(() => {});
      }
    }
  }

  public static async analyzeComplexity(code: string): Promise<PythonComplexity> {
    let scriptPath: string | null = null;
    let codePath: string | null = null;

    try {
      scriptPath = path.join(os.tmpdir(), `hi-ai-parser-${Date.now()}-${process.pid}.py`);
      await writeFile(scriptPath, this.pythonScript);

      codePath = path.join(os.tmpdir(), `hi-ai-code-${Date.now()}-${process.pid}.py`);
      await writeFile(codePath, code);

      const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" complexity < "${codePath}"`, {
        maxBuffer: 10 * 1024 * 1024
      });

      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.error('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || 'Python complexity analysis failed');
      }

      return {
        cyclomaticComplexity: result.cyclomaticComplexity || 1,
        functions: result.functions || [],
        classes: result.classes || []
      };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error('Python 3 not found. Please install Python 3 to analyze Python code.');
      }
      throw error;
    } finally {
      // Always cleanup temp files, even on error
      if (scriptPath) {
        await unlink(scriptPath).catch(() => {});
      }
      if (codePath) {
        await unlink(codePath).catch(() => {});
      }
    }
  }

  public static isPythonFile(filePath: string): boolean {
    return filePath.endsWith('.py');
  }

  public static isPythonCode(code: string): boolean {
    // Heuristic: Check for Python-specific patterns
    const pythonPatterns = [
      /^import\s+\w+/m,
      /^from\s+\w+\s+import/m,
      /^def\s+\w+\s*\(/m,
      /^class\s+\w+/m,
      /^if\s+__name__\s*==\s*['"]__main__['"]/m
    ];

    return pythonPatterns.some(pattern => pattern.test(code));
  }
}
