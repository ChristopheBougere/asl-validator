{
  "Comment": "Using Map state in Inline mode",
  "StartAt": "Pass",
  "States": {
    "Pass": {
      "Type": "Pass",
      "Next": "Map demo",
      "Result": {
        "foo": "bar",
        "colors": [
          "red",
          "green",
          "blue",
          "yellow",
          "white"
        ]
      }
    },
    "Map demo": {
      "Type": "Map",
      "ItemsPath": "$.colors",
      "ItemProcessor": {
        "ProcessorConfig": {
          "Mode": "INLINE"
        },
        "StartAt": "Generate UUID",
        "States": {
          "Generate UUID": {
            "Type": "Pass",
            "End": true,
            "Parameters": {
              "uuid.$": "States.UUID()"
            },
            "OutputPath": "$.uuid"
          }
        }
      },
      "End": true
    }
  }
}
