import {isArnFormatValid} from "../checks/formats";

describe("task arn unit tests", () => {
    const valid_inputs = [
        "arn:aws:states:::lambda:invoke",
        "arn:aws:states:::states:startExecution.sync:2",
        "arn:aws:states:::dynamodb:updateItem",
        "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
        "arn:aws:iam::123456789012:user/*",
        "arn:aws:s3:::my_corporate_bucket/Development/*",
        "arn:aws:lambda:region-1:1234567890:function:FUNCTION_NAME:AZaz12-_"

    ];
    test.each(valid_inputs)("%s", (input) => {
        expect(isArnFormatValid(input)).toBe(true);
    });

    const invalid = [
        "arn:aws:iam::123456789012:u*",
        "arn:aws:::123456789012:resource",
        "xyz:aws:iam::123456789012:resource",
        "arn:invalid:iam::123456789012:resource",
        "arn:aws:lambda:region-1:1234567890:function:FUNCTION_NAME:",
    ]
    test.each(invalid)("%s", (input) => {
        expect(isArnFormatValid(input)).toBe(false);
    });

});