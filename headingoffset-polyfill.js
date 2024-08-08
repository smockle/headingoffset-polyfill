// @ts-check

const managedHeadings = new WeakSet();

const ariaLevelObserver = new MutationObserver(function (mutationList) {
  for (const mutation of mutationList) {
    if (
      mutation.target instanceof Element &&
      mutation.target.matches("h1, h2, h3, h4, h5, h6")
    ) {
      // 'aria-level' was modified
      // 'aria-level' was added
      if (mutation.target.hasAttribute("aria-level")) {
        stopManagingHeading(mutation.target); // (it’ll get re-added if the polyfill made this change)
      }
      // 'aria-level' was removed
      else {
        startManagingHeading(mutation.target);
        applyHeadingOffset(mutation.target);
      }
    }
  }
});

if (!("headingOffset" in Element.prototype)) {
  // Reflect the 'headingoffset' attribute.
  Object.defineProperty(Element.prototype, "headingOffset", {
    enumerable: true,
    get: function () {
      const defaultValue = 0;
      const value = Number(this.getAttribute("headingoffset"));
      return !Number.isNaN(value) && value > 0 ? value : defaultValue;
    },
    set: function (headingOffset) {
      if (
        headingOffset === "" ||
        headingOffset === null ||
        headingOffset === undefined
      ) {
        this.removeAttribute("headingoffset");
        return;
      }
      this.setAttribute("headingoffset", headingOffset);
    },
  });

  new MutationObserver(function (mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        for (const addedNode of mutation.addedNodes) {
          // If a heading is added, apply its offset.
          if (addedNode instanceof HTMLHeadingElement) {
            applyHeadingOffset(addedNode);
          }

          // If a container with a 'headingoffset' attribute is added, apply offsets to its headings.
          else if (
            addedNode instanceof HTMLElement &&
            addedNode.querySelector("[headingOffset], h1, h2, h3, h4, h5, h6")
          ) {
            applyHeadingOffsets(addedNode);
          }
        }
      }

      // If a container’s 'headingoffset' attribute changes, reapply offsets.
      else if (
        mutation.type === "attributes" &&
        mutation.target instanceof HTMLElement
      ) {
        applyHeadingOffsets(mutation.target);
      }
    }
  }).observe(document.body, {
    attributeFilter: ["headingoffset"],
    childList: true,
    subtree: true,
  });

  ariaLevelObserver.observe(document.body, {
    attributeFilter: ["aria-level"],
    subtree: true,
  });

  applyHeadingOffsets(document.documentElement);
}

/**
 * Applies offsets all headings in a container, where needed.
 * @param {Element} container A container element.
 */
function applyHeadingOffsets(container) {
  const headings = Array.from(
    container.querySelectorAll("h1, h2, h3, h4, h5, h6")
  );
  for (const heading of headings) {
    applyHeadingOffset(heading);
  }
}

/** Track headings whose 'aria-level' is set by the polyfill. */
function isManagedHeading(heading) {
  return managedHeadings.has(heading);
}
function startManagingHeading(heading) {
  managedHeadings.add(heading);
}
function stopManagingHeading(heading) {
  managedHeadings.delete(heading);
}

/**
 * Applies an offset to a heading, if needed.
 * @param {Element} heading A heading element.
 */
function applyHeadingOffset(heading) {
  // If 'aria-level' is already set and the polyfill didn’t set it, don’t change it.
  if (heading.hasAttribute("aria-level") && !isManagedHeading(heading)) {
    return;
  }

  const level = Number(heading.tagName[1]);
  const offset = getHeadingOffset(heading, 9 - level);
  const ariaLevel = level + offset;

  // If the level wouldn’t change, don’t set 'aria-level', and remove it if it’s redundant.
  if (ariaLevel === level) {
    heading.removeAttribute("aria-level");
    return;
  }

  heading.setAttribute("aria-level", String(ariaLevel));
  ariaLevelObserver.takeRecords();
  startManagingHeading(heading);
}

/**
 * Determines the number of levels to offset a heading’s level, by summing the 'headingoffset' attributes of all its parents.
 * If the offset would be greater than the maximum offset, returns 0.
 * @param {Element} heading A heading element.
 * @returns {number} Number of levels (0 or above) to offset the heading.
 */
function getHeadingOffset(heading, maxOffset) {
  let offset = 0;

  let ancestor = heading.parentNode;
  while (ancestor && ancestor instanceof HTMLElement) {
    const ancestorHeadingOffset = Number(
      ancestor.getAttribute("headingoffset")
    );
    // Don’t allow negative offsets.
    if (!Number.isNaN(ancestorHeadingOffset) && ancestorHeadingOffset > 0)
      offset += ancestorHeadingOffset;
    ancestor = ancestor.parentNode;
  }

  return offset <= maxOffset ? offset : 0;
}
