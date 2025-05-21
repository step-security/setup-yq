# setup-yq

Sets up [YQ][ref-yq], yet-another-markup-language-query-er, for use in your GitHub Actions workflow. (And it caches it, too!)

**NB: This version of YQ purposefully diverges from JQ's argument format.**

## Usage

```
# in your job:
name: MY GREAT JOB
on:
  push:
    branches:
      - '*'
jobs:
  yq-example:
    name: YQ example!
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
    - uses: step-security/setup-yq@ad0cf3bb7054291a414b615c1160ce0af1193a26 # v1.0.1
    - name: Show folks how to run YQ:
      run: |
        yq --help

```

## License

Apache-2.0

[ref-yq]: https://github.com/mikefarah/yq
