const APILinter = require("./api-linter");
const Black = require("./black");
const DotnetFormat = require("./dotnet-format");
const Erblint = require("./erblint");
const ESLint = require("./eslint");
const Flake8 = require("./flake8");
const Gofmt = require("./gofmt");
const Golint = require("./golint");
const Mypy = require("./mypy");
const Oitnb = require("./oitnb");
const PHPCodeSniffer = require("./php-codesniffer");
const Prettier = require("./prettier");
const RuboCop = require("./rubocop");
const Stylelint = require("./stylelint");
const SwiftFormatLockwood = require("./swift-format-lockwood");
const SwiftFormatOfficial = require("./swift-format-official");
const SwiftLint = require("./swiftlint");
const XO = require("./xo");

const linters = {
	// Linters
	apilinter: APILinter,
	erblint: Erblint,
	eslint: ESLint,
	flake8: Flake8,
	golint: Golint,
	mypy: Mypy,
	php_codesniffer: PHPCodeSniffer,
	rubocop: RuboCop,
	stylelint: Stylelint,
	swiftlint: SwiftLint,
	xo: XO,

	// Formatters (should be run after linters)
	black: Black,
	dotnet_format: DotnetFormat,
	gofmt: Gofmt,
	oitnb: Oitnb,
	prettier: Prettier,
	swift_format_lockwood: SwiftFormatLockwood,
	swift_format_official: SwiftFormatOfficial,

	// Alias of `swift_format_lockwood` (for backward compatibility)
	// TODO: Remove alias in v2
	swiftformat: SwiftFormatLockwood,
};

module.exports = linters;
