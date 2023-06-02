import fs from "fs";
import path from "path";
import { StateMachine, ValidationOptions } from "../types";
import validator from "../validator";

describe("show how the options impact validation", () => {
  const loadDef = (file: string): StateMachine => {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "definitions", file), "utf-8")
    ) as StateMachine;
  };

  const expectValid = (file: string, options: ValidationOptions): void => {
    const definition = loadDef(file);
    const { isValid, errors } = validator(definition, options);
    expect(errors ?? []).toStrictEqual([]);
    expect(isValid).toBe(true);
  };

  const expectInvalid = (file: string, options: ValidationOptions): void => {
    const definition = loadDef(file);
    const { isValid } = validator(definition, options);
    expect(isValid).toBe(false);
  };

  describe("checkPaths", () => {
    const options: ValidationOptions = {
      checkPaths: false,
      checkArn: true,
    };
    it.each(["invalid-json-path.json", "invalid-payload-template.asl.json"])(
      "%s should not report path error",
      (file) => {
        expect.hasAssertions();
        expectValid(file, options);
      }
    );
    it("should still report other errors if path expressions are disabled", () => {
      expect.hasAssertions();
      expectInvalid("invalid-state-name-too-long.json", options);
    });
  });

  describe("checkArn", () => {
    const options: ValidationOptions = {
      checkPaths: true,
      checkArn: false,
    };
    it("should ignore task arn errors", () => {
      expect.hasAssertions();
      expectValid("invalid-cfn-definition-substitutions.json", options);
    });
    it("should still report other errors if task arn checks are disabled", () => {
      expect.hasAssertions();
      expectInvalid("invalid-state-name-too-long.json", options);
    });
  });
});
