# Issue Prioritizer

Prioritizes issues in a specified column of a GitHub project board.


## Usage

You can use it as follows in your GitHub workflow:

```yml
jobs:
  prioritize_project_issues:
    runs-on: ubuntu-latest
    name: Automatically reorder issues by priority in "Backlog" column.
    steps:
      - uses: RasaHQ/issue-prioritizer@master
        with:
          token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}  # you need a GitHub token with enough permissions
          column_id: 42
          order: priority:critical,priority:high,priority:normal,priority:low
          default_label: priority:normal
```

It will reorder cards in your project. Notes (that are not converted to issues) will be put at the top of the column.


## Develop

After checking out a copy of the repository locally, you run `yarn` or `npm install .` to install dependencies.

To run the script, you will need to pass environment variables that correspond to the inputs of the action:
```bash
INPUT_COLUMN_ID=42 INPUT_TOKEN=xxx INPUT_ORDER="priority:critical,priority:high,priority:normal,priority:low" INPUT_DEFAULT_LABEL="priority:normal" node index.js
```

That's it 🚀
