const fs = require('fs');
const path = require('path');

const validator = require('../validator');

describe('validator', () => {
  const files = fs.readdirSync(path.join(__dirname, 'definitions'));
  const regexp = /^(valid|invalid)-(.+)\.json$/;
  for (let i = 0; i < files.length; i += 1) {
    const match = regexp.exec(files[i]);
    if (match) {
      it(`${match[1]}-${match[2]}`, () => {
        const definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'definitions', files[i])));
        const { isValid, errors, errorsText } = validator(definition);
        const textErrors = errorsText();
        if (match[1] === 'valid') {
          expect(isValid).toBeTruthy();
          expect(Array.isArray(errors)).toBeTruthy();
          expect(errors.length).toEqual(0);
          expect(typeof textErrors)).toBe('string');
        } else if (match[1] === 'invalid') {
          expect(isValid).toBeFalsy();
          expect(Array.isArray(errors)).toBeTruthy();
          expect(errors.length).toBeGreaterThan(0);
          expect(typeof textErrors).toBe('string');
        }
      });
    }
  }
});
