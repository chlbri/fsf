# Changelog

<br/>

All notable changes to this project will be documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<br/>

## [1.0.0] - 2025-10-08

<br/>

<details>

<summary>

## [0.8.1] - 2025-10-07

</summary>

### Fixed

- Updated state management in Interpreter and Machine classes for better
  default behavior

### Added

- GitHub Action for automating npm version bump

</details>

<br/>

<details>
<summary>

## [0.8.0] - Previous versions

</summary>

### Added

- `unFreeze` option to allow context mutation
- Full support for XState syntax
- Improved typings for guards
- Support for asynchronous tests
- Better handling of transitions without events
- Support for final states
- Parameterized actions
- Parameterized guards
- Entry and exit actions
- Transition actions

### Changed

- Full compliance with XState syntax
- Significant improvement in TypeScript typings
- Refactoring of the transition system
- Better context management with deep cloning
- Improved documentation

### Fixed

- Import issues
- Build errors in CI
- Context handling in the serve function
- Typing issues
- Infinite loops in some cases
- Remaining context management

</details>

<br/>

<details>
<summary>

## [0.2.0] - Initial versions

</summary>

### Added

- Initial implementation of the finite state machine
- Support for final states
- Initial state
- Transitions (object and string)
- Context
- Unit tests with Vitest
- Rollup configuration for build
- ESLint and Prettier configuration
- Husky for git hooks
- README documentation

### Main features

- ✅ Final states
- ✅ Initial state
- ✅ Transitions (object)
- ✅ Transitions (target string)
- ✅ Transitions without events
- ✅ Final states
- ✅ Context
- ✅ Entry actions
- ✅ Exit actions
- ✅ Transition actions
- ✅ Parameterized actions
- ✅ Transition guards
- ✅ Parameterized guards
- ❌ Deferred transitions (not supported)
- ❌ Nested states (not supported)
- ❌ Parallel states (not supported)
- ❌ Asynchronous (not supported)

</details>

<br/>

<details>
<summary>

## [0.1.9] - Early versions

</summary>

### Added

- Comprehensive tests for all functions
- Initial project configuration
- TypeScript support
- Build configuration
- Tests with Vitest

### Changed

- Improved test organization
- Updated package.json

### Fixed

- Function binding issues
- Node.JS namespace
- Serve context

</details>

---

<br/>
<br/>

## Author

chlbri (bri_lvi@icloud.com)

[My github](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

<br/>

## Links

- [Documentation](https://github.com/chlbri/monadisk)
