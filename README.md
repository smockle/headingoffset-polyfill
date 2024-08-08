# headingoffset-polyfill

[![codecov](https://codecov.io/gh/smockle/headingoffset-polyfill/graph/badge.svg?token=gylmWj0rMR)](https://codecov.io/gh/smockle/headingoffset-polyfill)

Polyfill for the `headingoffset` attribute. Related discussion in https://github.com/whatwg/html/issues/5033.

## Usage

Add the polyfill:

```html
<script src="headingoffset-polyfill.js"></script>
```

> [!NOTE]
> The script will scan the existing document and monitor for changes after that.

Use `headingoffset`:

```html
<h1>I’m a level-1 heading!</h1>
<h2>I’m a level-2 heading!</h2>

<div headingoffset="1">
  <h1>I’m a level-2 heading!</h1>
  <h2>I’m a level-3 heading!</h2>
</div>
```

## Testing

This project uses [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) to run tests and collect coverage.

```shell
# Install dependencies
$ npm ci

# Run tests
$ npm test
```
