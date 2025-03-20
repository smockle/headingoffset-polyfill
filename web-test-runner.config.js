export default {
  files: "headingoffset-polyfill*.test.html",
  coverage: true,
  nodeResolve: true,
  plugins: [
    {
      name: "include-polyfill",
      transform(context) {
        if (context.response.is("html")) {
          return context.body.replace(
            /<\/body>/,
            `
  <script src="./headingoffset-polyfill.js"></script>
  <script type="module">
    import { runTests } from "@web/test-runner-mocha";
    import { tests } from "./headingoffset-polyfill.test.js";
    await Promise.resolve(globalThis.readyForTests).then(() => runTests(tests));
  </script>
</body>
`
          );
        }
      },
    },
  ],
};
