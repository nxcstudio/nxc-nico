export interface ParsedVerificationReport {
  passed: boolean;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  summary: string;
  failureDetails?: string;
}

export class ExecutionValidator {
  parseTestOutput(stdout: string, stderr: string, exitCode: number): ParsedVerificationReport {
    const combined = `${stdout}\n${stderr}`;
    const passed = exitCode === 0;

    // Pattern matching for typical Jest / Vitest / Mocha / Pytest outputs
    const jestMatch = combined.match(/Tests:\s+([0-9]+)\s+passed,\s+([0-9]+)\s+total/i);
    const genericPass = combined.includes('PASS') || combined.includes('All tests passed') || exitCode === 0;

    if (jestMatch) {
      const passedTests = parseInt(jestMatch[1], 10);
      const totalTests = parseInt(jestMatch[2], 10);
      return {
        passed,
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        summary: `Verification ${passed ? 'SUCCEEDED' : 'FAILED'}: ${passedTests}/${totalTests} tests passing.`,
        failureDetails: !passed ? stderr : undefined
      };
    }

    return {
      passed,
      summary: passed
        ? 'Sandbox verification completed successfully. Zero errors reported.'
        : `Sandbox verification failed with exit code ${exitCode}.`,
      failureDetails: !passed ? (stderr || stdout).slice(-1000) : undefined
    };
  }
}
