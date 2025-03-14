import { expect } from "@esm-bundle/chai";

export async function tests() {
  describe("heading levels", () => {
    it("calculated levels match expected values in comments in light DOM", () => {
      let count = 0;
      for (const heading of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
        const commentText = heading.firstChild?.nodeValue;
        /* c8 ignore next 3 */
        if (!commentText || heading.firstChild.nodeType !== Node.COMMENT_NODE) {
          throw new Error("Comment text not found");
        }
        const expectedLevel = commentText.match(/Level (\d)/)[1];
        expect(heading.getAttribute("aria-level"), heading.outerHTML).to.equal(
          expectedLevel
        );
        count++;
      }
      /* c8 ignore next 1 */
      expect(count).to.be.above(0);
    });
    it("calculated levels match expected values in comments in shadow DOM", () => {
      let count = 0;
      for (const root of document.querySelectorAll("[title*=shadowroot]")) {
        for (const heading of root.shadowRoot.querySelectorAll(
          "h1,h2,h3,h4,h5,h6"
        )) {
          const commentText = heading.firstChild?.nodeValue;
          /* c8 ignore next 6 */
          if (
            !commentText ||
            heading.firstChild.nodeType !== Node.COMMENT_NODE
          ) {
            throw new Error("Comment text not found");
          }
          const expectedLevel = commentText.match(/Level (\d)/)[1];
          expect(
            heading.getAttribute("aria-level"),
            heading.outerHTML
          ).to.equal(expectedLevel);
          count++;
        }
        /* c8 ignore next 2 */
        expect(count).to.be.above(0);
      }
    });
  });

  describe("headingoffset", () => {
    let container, initialOffset;
    beforeEach(() => {
      container = document.querySelector("[headingoffset]");
      initialOffset = container.getAttribute("headingoffset");
    });
    afterEach(() => {
      container.setAttribute("headingoffset", initialOffset);
    });
    it("offsets have matching IDL", () => {
      let count = 0;
      for (const container of document.querySelectorAll("[headingoffset]")) {
        expect("headingOffset" in container).to.equal(true);
        expect(container.headingOffset, container.outerHTML).to.equal(
          Math.min(Math.max(container.getAttribute("headingoffset"), 0), 9)
        );
        count++;
      }
      expect(count).to.be.above(0);
    });
    it("setting via JS affects HTML, and vice-versa", function () {
      container.headingOffset = 1;
      expect(container.getAttribute("headingoffset")).to.equal("1");
      container.setAttribute("headingoffset", "2");
      expect(container.headingOffset).to.equal(2);
      container.headingOffset = undefined;
      expect(container.hasAttribute("headingoffset")).to.equal(false);
      expect(container.headingOffset).to.equal(0);
      container.headingOffset = null;
      expect(container.hasAttribute("headingoffset")).to.equal(false);
      expect(container.headingOffset).to.equal(0);
      container.headingOffset = "";
      expect(container.hasAttribute("headingoffset")).to.equal(false);
      expect(container.headingOffset).to.equal(0);
      container.headingOffset = "fish";
      expect(container.headingOffset).to.equal(0);
    });
  });
}
