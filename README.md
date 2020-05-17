# asl-validator

[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ChristopheBougere/asl-validator/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/asl-validator.svg)](https://badge.fury.io/js/asl-validator)

[![NPM](https://nodei.co/npm/asl-validator.png?stars=true)](https://www.npmjs.com/package/asl-validator)

A simple [**Amazon States Language**](https://states-language.net/spec.html) validator based on JSON schemas. It also validates JSON paths syntax in `InputPath`, `OutputPath` and `ResultPath`.

When writing your state machine (for AWS step functions), you can't locally validate you state machine definition without creating it. `asl-validator` makes it possible.

## Install
```bash
# Use via the CLI
npm install -g asl-validator
# Use in your code
npm install asl-validator
```

## CLI
```bash
$ asl-validator --help

  Usage: asl-validator [options]

  Amazon States Language validator


  Options:

    -v, --version                       output the version number
    --json-definition <jsonDefinition>  JSON definition
    --json-path <jsonPath>              JSON path
    --silent                            silent mode
    -h, --help                          output usage information
```
Return status:
- `0` if state machine definition is valid
- `1` if state machine definition is invalid
- `2` if an exception occurs

## In your code
```javascript
const aslValidator = require('asl-validator');
const definition = require('./path/to/my/state/machine/json/definition');
const { isValid, errors, errorsText } = aslValidator(definition);
if (isValid) {
  console.log('✓ State machine definition is valid')
} else {
  // Either go through the errors object
  console.error('✕ State machine definition is invalid:', errors.map(({ message }) => message).join('\n'));
  // Or display the preformatted errors text
  console.error('✕ State machine definition is invalid:', errorsText('\n'));
}
```

## Test
```bash
npm run test
```

## Lint
```bash
npm run lint
```

## See also
- [ASL specifications](https://states-language.net/spec.html)
- [ASL documentation on AWS website](http://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [Blog post](https://www.tbray.org/ongoing/When/201x/2016/12/01/J2119-Validator) from the creator of ASL explaining the pros and cons of a JSON schema based validator. An RFC based looks really interesting, but still the JSON schema approach seems more flexible and evolutive.


## License
See [LICENSE](./LICENSE).
