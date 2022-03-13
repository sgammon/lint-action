const APILinter = require("../../../src/linters/api-linter");

const testName = "api-linter";
const linter = APILinter;
const commandPrefix = "";
const extensions = ["proto"];

// Linting without auto-fixing
function getLintParams(dir) {
    const problems_sample = (
`- file_path: sample.proto
  problems:
  - message: RPCs must include HTTP definitions using the ${'`google.api.http`'} annotation.
    location:
      start_position:
        line_number: 12
        column_number: 5
      end_position:
        line_number: 12
        column_number: 70
    rule_id: core::0127::http-annotation
    rule_doc_uri: https://linter.aip.dev/127/http-annotation`.trimStart());
	return {
		// Expected output of the linting function
		cmdOutput: {
			status: 0,
			stdoutParts: [problems_sample],
			stdout: problems_sample,
		},
		// Expected output of the parsing function
		lintResult: {
			isSuccess: false,
			warning: [],
			error: [
				{
					path: "sample.proto",
					firstLine: 12,
					lastLine: 12,
					message: `RPCs must include HTTP definitions using the ${'`google.api.http`'} annotation.`,
				}
			],
		},
	};
}

// Linting with auto-fixing
function getFixParams(dir) {
    // linting with auto-fixing is not yet supported by the API linter
	return getLintParams(dir);
}

module.exports = [testName, linter, commandPrefix, extensions, getLintParams, getFixParams];
