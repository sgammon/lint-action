const glob = require("glob");
const YAML = require("yaml");
const { run } = require("../utils/action");
const commandExists = require("../utils/command-exists");
const { parseErrorsFromDiff } = require("../utils/diff");
const { initLintResult } = require("../utils/lint-result");

/** @typedef {import('../utils/lint-result').LintResult} LintResult */

/**
 * API linter result source-code coordinates.
 * @typedef APILintCodePosition
 * @property {number} line_number Line number in source code
 * @property {number} column_number Column number in source code
 */

/**
 * API linter result source-code coordinates.
 * @typedef APILintSourceLocation
 * @property {APILintCodePosition} start_position Start position for the violation
 * @property {APILintCodePosition} end_position End position for the violation
 */

/**
 * API linter problem spec structure.
 * @typedef APILintProblemSpec
 * @property {string} message Message about the lint violation
 * @property {string} rule_id ID of the rule that was violated
 * @property {string} rule_doc_uri URL to documentation for the rule
 * @property {APILintSourceLocation} location Location of the violation
 */

/**
 * API linter result stanza.
 * @typedef APILintResultStanza
 * @property {string} file_path Path to the file that was linted
 * @property {APILintProblemSpec[]} problems List of problems found in the file
 */

/**
 * https://linter.aip.dev/
 */
class APILinter {
	static get name() {
		return "APILinter";
	}

	/**
	 * Verifies that all required programs are installed. Throws an error if programs are missing
	 * @param {string} dir - Directory to run the linting program in
	 * @param {string} prefix - Prefix to the lint command
	 */
	static async verifySetup(dir, prefix = "") {
		// Verify that the API linter binary is installed
		if (!(await commandExists("api-linter"))) {
			throw new Error("API linter is not installed");
		}

		// Verify that calling the linter works
		try {
			run(`${prefix} api-linter --version`, { dir });
		} catch (err) {
			throw new Error(`${this.name} is not installed`);
		}
	}

	/**
	 * Runs the linting program and returns the command output
	 * @param {string} dir - Directory to run the linter in
	 * @param {string[]} extensions - File extensions which should be linted
	 * @param {string} args - Additional arguments to pass to the linter
	 * @param {boolean} fix - Whether the linter should attempt to fix code style issues automatically
	 * @param {string} prefix - Prefix to the lint command
	 * @returns {{status: number, stdout: string, stderr: string}} - Output of the lint command
	 */
	static lint(dir, extensions, args = "", fix = false, prefix = "") {
        const files = glob.sync( (dir ?
            `${dir}/**/` :
            './') + '*.proto');
        if (files.length > 0) {
            const fileArgs = files.map((file) => {
                return `"${file}"`;
            }).join(' ');
            console.log("MATCHED FILES: " + JSON.stringify(files));
            const cmd = `${prefix} api-linter ${args} ${fileArgs}`;
            console.log("CMD: ", cmd);
            const runResult = run(cmd, {
                dir,
                ignoreErrors: true,
            });
            console.log("RUN RESULT: ", JSON.stringify(runResult));
            return runResult;
        } else {
            console.log("MATCHED FILES: " + JSON.stringify(files));
            return {
                status: 0,  // synthesize successful response, there are no protos to check.
                stdout: '',
                stderr: ''
            };
        }
	}

    /**
     * Transform/interpret a single problem result from the linter
     * @param {string} path Path to the file that was linted
     * @param {APILintResultStanza} stanza Single result stanza to interpret
     * @return {{path: string, firstLine: number, lastLine: number, message: string}} Single error
     * result.
     */
    static resultForProblem(path, stanza) {
        const result = {
            path,
            message: stanza.message,
            firstLine: stanza.location.start_position.line_number,
            lastLine: stanza.location.end_position.line_number
        };
        console.log("REPORTING: " + JSON.stringify(result));
        return result;
    }

    /**
     * Map parsed YAML problems to lint results
     * @param {APILintResultStanza[]} payload Set of result stanzas to interpret
     * @returns {{path: string, firstLine: number, lastLine: number, message: string}[]} - Array of
     * parsed errors
     */
    static mapProblems(payload) {
        return [].concat.apply([], payload.map(proto => {
            return proto.problems.map(problem => {
                return APILinter.resultForProblem(
                    proto.file_path,
                    problem
                );
            });
        }));
    }

	/**
	 * Parses the output of the lint command. Determines the success of the lint process and the
	 * severity of the identified code style violations
	 * @param {string} dir - Directory in which the linter has been run
	 * @param {{status: number, stdout: string, stderr: string}} output - Output of the lint command
	 * @returns {LintResult} - Parsed lint result
	 */
	static parseOutput(dir, output) {
        // sample structure (per file):
        // - file_path: some/path/to/a.proto
        //   problems:
        //   - message: Delete methods should include `(google.api.method_signature) = "name"`
        //     location:
        //     start_position:
        //       line_number: 184
        //       column_number: 3
        //     end_position:
        //       line_number: 219
        //       column_number: 3
        //   rule_id: core::0135::method-signature
        //   rule_doc_uri: https://linter.aip.dev/135/method-signature
        const lintResult = initLintResult();
        const yamlResult = YAML.parse(output.stdout);
		lintResult.isSuccess = output.status === lintResult.error.length > 0;
		lintResult.error = APILinter.mapProblems(yamlResult) || [];
        return lintResult;
	}
}

module.exports = APILinter;
