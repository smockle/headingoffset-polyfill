import { expect } from "@esm-bundle/chai";

export async function tests() {
  describe("heading levels", () => {
    it("calculated levels match expected values in comments", () => {
      let count = 0;
      const roots = [
        document,
        ...Array.from(document.querySelectorAll("[title*=shadowroot]")).map(
          (el) => el.shadowRoot
        ),
      ];
      for (const root of roots) {
        for (const heading of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
          const commentText = heading.firstChild?.nodeValue;
          /* c8 ignore start */
          if (
            !commentText ||
            heading.firstChild.nodeType !== Node.COMMENT_NODE
          ) {
            throw new Error("Comment text not found");
          }
          /* c8 ignore stop */
          const expectedLevel = commentText.match(/Level (\d)/)[1];
          const actualLevel = heading.hasAttribute("aria-level")
            ? heading.getAttribute("aria-level")
            : heading.tagName[1];
          const message =
            heading.parentElement instanceof HTMLDialogElement
              ? heading.parentElement.outerHTML
              : heading.outerHTML;
          expect(actualLevel, message).to.equal(expectedLevel);
          count++;
        }
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

  describe("headingreset", () => {
    let container, initialReset;
    beforeEach(() => {
      container = document.querySelector("body");
      initialReset = container.hasAttribute("headingreset");
    });
    afterEach(() => {
      if (initialReset) {
        container.setAttribute("headingreset", "");
      }
    });
    it("setting via JS affects HTML, and vice-versa", function () {
      container.headingReset = "headingreset";
      expect(container.getAttribute("headingreset")).to.equal("");
      expect(container.headingReset).to.equal(true);
      container.headingReset = undefined;
      expect(container.hasAttribute("headingreset")).to.equal(false);
      expect(container.headingReset).to.equal(false);
      container.headingReset = null;
      expect(container.hasAttribute("headingreset")).to.equal(false);
      expect(container.headingReset).to.equal(false);
      container.setAttribute("headingreset", "");
      expect(container.hasAttribute("headingreset")).to.equal(true);
      expect(container.headingReset).to.equal(true);
      container.headingReset = "fish";
      expect(container.getAttribute("headingreset")).to.equal("");
      expect(container.headingReset).to.equal(true);
    });
  });
}
