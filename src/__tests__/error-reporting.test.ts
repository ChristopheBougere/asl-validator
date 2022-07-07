import fs from "fs";
import path from "path";
import {StateMachine, StateMachineError, StateMachineErrorCode} from "../types";
import validator from "../validator";

describe("tests with definitions containing errors to see what's reported", () => {

    const inputs: Array<{
        file: string;
        expected_errors: StateMachineError[]
    }> = [
        {
            file: "invalid-exercise-ajv.asl.json",
            expected_errors: [
                {
                    "Error code": StateMachineErrorCode.SchemaValidationFailed,
                    Message: "must match format \"asl_path\"",
                    schemaError: {
                        instancePath: "/States/PassState/InputPath",
                        schemaPath: "paths.json#/definitions/asl_path/format"
                    }
                }
            ]
        },
        {
            file: "invalid-exercise-ajv-additional-properties.asl.json",
            expected_errors: [
                {
                    "Error code": StateMachineErrorCode.SchemaValidationFailed,
                    Message: "/States/PassState is invalid.",
                    schemaError: {
                        instancePath: "/States/PassState",
                        schemaPath: "#/oneOf"
                    }
                }
            ]
        }
    ];

    test.each(inputs)("$file", (input) => {
        expect.hasAssertions();
        const definition = JSON.parse(fs.readFileSync(path.join(__dirname, 'definitions', input.file), "utf-8")) as StateMachine;
        const {isValid, errors} = validator(definition);
        expect(isValid).toBe(false);
        expect(errors).toHaveLength(input.expected_errors.length);
        expect(errors).toStrictEqual(input.expected_errors)
    });

});