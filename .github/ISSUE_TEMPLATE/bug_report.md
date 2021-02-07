---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Please provide a complete state machine definition:
```json
{
  "StartAt": "EmptyState",
  "States": {
    "EmptyState": {
      "End": true
    }
  }
}
```

**Expected behavior**
A clear and concise description of what you expected to happen.

**Version:** [e.g. 1.9.4, can be found by running `asl-validator --version`]

**Additional context**
Add any other context about the problem here.
