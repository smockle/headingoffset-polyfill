// @ts-check

// Track headings with polyfill-managed 'aria-level' attributes
const managedHeadings = new WeakSet();

// Track observed roots
const observedRoots = new WeakSet();

/** Handle 'aria-level' attribute changes */
const ariaLevelObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (!(mutation.target instanceof HTMLHeadingElement)) continue;

    const heading = mutation.target;
    if (heading.hasAttribute("aria-level")) {
      // Attribute was added or modified - stop managing unless we did it
      managedHeadings.delete(heading);
    } else {
      // Attribute was removed - start managing and reapply
      updateAriaLevel(heading);
    }
  }
});

/** Handle changes to 'headingoffset' and 'headingreset' attributes and DOM structure */
const headingObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      // Handle added nodes
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }
        // If a heading is added, update its 'aria-level' attribute
        if (node instanceof HTMLHeadingElement) {
          updateAriaLevel(node);
        }
        // If a container with relevant attributes is added, update child headings’ 'aria-level' attributes
        else if (
          node.querySelector(
            "h1, h2, h3, h4, h5, h6, [headingoffset], [headingreset]"
          )
        ) {
          getHeadings(node).forEach((heading) => updateAriaLevel(heading));
        }
        // Observe roots in added nodes
        if (node.shadowRoot) {
          observeRoot(node.shadowRoot);
        }
        // Observe roots in added declarative shadow DOM
        const templates = node.querySelectorAll("template[shadowrootmode]");
        for (const template of templates) {
          const host = template.parentNode;
          if (host instanceof HTMLElement && host.shadowRoot) {
            observeRoot(host.shadowRoot);
          }
        }
      }
    } else if (
      mutation.type === "attributes" &&
      mutation.target instanceof HTMLElement
    ) {
      // If a container's attributes change, update child headings’ 'aria-level' attributes
      getHeadings(mutation.target).forEach((heading) =>
        updateAriaLevel(heading)
      );
    }
  }
});

/**
 * Watch a document or shadow root for changes
 * @param {Document|ShadowRoot} root A document or shadow root
 */
function observeRoot(root) {
  // Early-return if the root is already observed
  if (observedRoots.has(root)) {
    return;
  }
  observedRoots.add(root);

  ariaLevelObserver.observe(root, {
    attributeFilter: ["aria-level"],
    subtree: true,
  });

  headingObserver.observe(root, {
    attributeFilter: ["headingoffset", "headingreset"],
    childList: true,
    subtree: true,
  });

  getHeadings(root).forEach((heading) => updateAriaLevel(heading));
}

/**
 * Get a container’s child headings
 * @param {Element|Document|ShadowRoot} container
 * @returns {HTMLHeadingElement[]} An array of heading elements
 */
function getHeadings(container) {
  /** Get child headings @type {HTMLHeadingElement[]} */
  const headings = Array.from(
    container.querySelectorAll("h1, h2, h3, h4, h5, h6")
  );
  // Add headings in shadow roots
  for (const element of container.querySelectorAll("*")) {
    if (element.shadowRoot) {
      /** @type {HTMLHeadingElement[]} */
      const shadowHeadings = Array.from(
        element.shadowRoot.querySelectorAll("h1, h2, h3, h4, h5, h6")
      );
      headings.push(...shadowHeadings);
    }
  }
  return headings;
}

/**
 * Updates a heading’s 'aria-level' attribute, based on its offset
 * @param {HTMLHeadingElement} heading
 */
function updateAriaLevel(heading) {
  // Early-return if 'aria-level' was not set by the polyfill
  if (heading.hasAttribute("aria-level") && !managedHeadings.has(heading)) {
    return;
  }

  const tagLevel = Number(heading.tagName[1]);
  const offset = computeHeadingOffset(heading, 9 - tagLevel);
  const ariaLevel = tagLevel + offset;

  // Don’t set 'aria-level' if it’s redundant
  if (ariaLevel === tagLevel) {
    heading.removeAttribute("aria-level");
    return;
  }

  heading.setAttribute("aria-level", String(ariaLevel));
  ariaLevelObserver.takeRecords(); // Prevent observer loop
  managedHeadings.add(heading);
}

/**
 * Determines whether an element is explicitly (via the 'headingreset' attribute)
 * or implicitly (as a modal dialog) a 'headingoffset' accumulation boundary.
 * @param {Element} element
 * @returns {boolean}
 */
function isOffsetBoundary(element) {
  // Modal dialogs implicitly reset heading levels
  if (element instanceof HTMLDialogElement) {
    return (
      element.open &&
      element.hasAttribute("open") &&
      (element.matches(":modal") ||
        element.ownerDocument.querySelector(":modal") === element)
    );
  }
  return element.hasAttribute("headingreset");
}

/**
 * Compute the heading’s offset (from its 'tagName' level) by summing its ancestors’
 * 'headingoffset' attributes, up to a 'headingreset' boundary.
 * @param {Element} heading A heading element.
 * @param {number} maxOffset Maximum offset to apply (0-9).
 * @returns {number} Number of levels (0 to 'maxOffset') to offset the heading.
 */
function computeHeadingOffset(heading, maxOffset) {
  // Early-return if the heading is (itself) a boundary
  if (isOffsetBoundary(heading)) {
    return Math.min(heading.headingOffset || 0, maxOffset);
  }

  // Accumulate 'headingoffset' values upwards, handling shadow boundaries and slots
  let offset = heading.headingOffset || 0;
  let ancestor = heading;
  while (ancestor) {
    // Move to parent (or assigned slot, or shadow host)
    if (ancestor.assignedSlot) {
      ancestor = ancestor.assignedSlot;
    } else if (ancestor.parentElement) {
      ancestor = ancestor.parentElement;
    } else if (ancestor.getRootNode() instanceof ShadowRoot) {
      ancestor = ancestor.getRootNode().host;
    } else {
      break;
    }

    // Add this element's offset
    offset += ancestor.headingOffset || 0;

    // Early-return if the ancestor is a boundary
    if (isOffsetBoundary(ancestor)) {
      return Math.min(offset, maxOffset);
    }

    // Early-return if the maximum offset is reached
    if (offset >= maxOffset) {
      return maxOffset;
    }
  }

  return Math.min(offset, maxOffset);
}

// Initialize the polyfill
(() => {
  // Early-return (without polyfilling) if 'headingoffset' is natively-supported
  if ("headingOffset" in Element.prototype) {
    return;
  }

  // Define 'headingOffset' IDL attribute
  Object.defineProperty(Element.prototype, "headingOffset", {
    get() {
      const value = Number(this.getAttribute("headingoffset"));
      return Math.min(Math.max(value || 0, 0), 9);
    },
    set(value) {
      if (value === undefined || value === null || value === "") {
        this.removeAttribute("headingoffset");
      } else {
        if (!isNaN(Number(value))) {
          this.setAttribute("headingoffset", value);
        }
      }
    },
    enumerable: true,
  });

  // Define 'headingReset' IDL attribute
  Object.defineProperty(Element.prototype, "headingReset", {
    get() {
      return this.hasAttribute("headingreset");
    },
    set(value) {
      if (value) {
        this.setAttribute("headingreset", "");
      } else {
        this.removeAttribute("headingreset");
      }
    },
    enumerable: true,
  });

  // Patch 'attachShadow' to handle (future) shadow roots
  const originalAttachShadow = Element.prototype.attachShadow;
  Object.defineProperty(Element.prototype, "attachShadow", {
    value: function (...args) {
      const shadowRoot = originalAttachShadow.call(this, args);
      observeRoot(shadowRoot);
      return shadowRoot;
    },
  });

  // Handle document and current shadow roots
  function findAndObserveShadowRoots(root) {
    const elements = root.querySelectorAll("*");
    for (const element of elements) {
      if (element.shadowRoot) {
        observeRoot(element.shadowRoot);
        findAndObserveShadowRoots(element.shadowRoot);
      }
    }
  }
  observeRoot(document);
  findAndObserveShadowRoots(document);
})();
