const SUPPRESSED_NATIVE_TITLE_ATTRIBUTE = "data-antidrain-suppressed-title";
const GLOSSARY_LINK_SELECTOR = ".vp-doc a.glossary-link[data-glossary-tooltip]";
const TOOLTIP_ELEMENT_ID = "docs-cursor-tooltip";

type SuppressedTitleEntry = {
  element: HTMLElement;
  hadTitle: boolean;
  title: string | null;
};

function readTooltipMessage(trigger: HTMLElement) {
  if (trigger.dataset.glossaryTooltip) {
    return trigger.dataset.glossaryTooltip.trim();
  }

  if (trigger.hasAttribute("title")) {
    return (trigger.getAttribute("title") || "").trim();
  }

  if (trigger.hasAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE)) {
    return (trigger.getAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE) || "").trim();
  }

  return "";
}

function suppressNativeTitles(elements: HTMLElement[]) {
  const entries: SuppressedTitleEntry[] = [];

  for (const element of elements) {
    entries.push({
      element,
      hadTitle: element.hasAttribute("title"),
      title: element.getAttribute("title")
    });

    if (element.hasAttribute("title")) {
      element.setAttribute(
        SUPPRESSED_NATIVE_TITLE_ATTRIBUTE,
        element.getAttribute("title") || ""
      );
    } else {
      element.removeAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE);
    }

    element.removeAttribute("title");
  }

  return entries;
}

function restoreNativeTitles(entries: SuppressedTitleEntry[]) {
  for (const entry of entries) {
    if (entry.element.hasAttribute("title")) {
      entry.element.removeAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE);
      continue;
    }

    if (entry.hadTitle && typeof entry.title === "string") {
      entry.element.setAttribute("title", entry.title);
      entry.element.removeAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE);
      continue;
    }

    entry.element.removeAttribute(SUPPRESSED_NATIVE_TITLE_ATTRIBUTE);
    entry.element.removeAttribute("title");
  }
}

function ensureTooltipElement() {
  let tooltip = document.getElementById(TOOLTIP_ELEMENT_ID);

  if (tooltip instanceof HTMLElement) {
    return tooltip;
  }

  tooltip = document.createElement("div");
  tooltip.id = TOOLTIP_ELEMENT_ID;
  tooltip.className = "docs-cursor-tooltip";
  tooltip.setAttribute("role", "status");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltip);
  return tooltip;
}

function positionTooltip(tooltip: HTMLElement, clientX: number, clientY: number) {
  const viewportPadding = 16;
  const cursorOffsetX = 14;
  const cursorOffsetY = 18;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
  const maxTop = window.innerHeight - tooltipHeight - viewportPadding;
  const left = Math.min(clientX + cursorOffsetX, Math.max(viewportPadding, maxLeft));
  const top = Math.min(clientY + cursorOffsetY, Math.max(viewportPadding, maxTop));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showTooltip(tooltip: HTMLElement, message: string, clientX: number, clientY: number) {
  tooltip.textContent = message;
  tooltip.classList.add("is-visible");
  tooltip.setAttribute("aria-hidden", "false");
  positionTooltip(tooltip, clientX, clientY);
}

function hideTooltip(tooltip: HTMLElement) {
  tooltip.classList.remove("is-visible");
  tooltip.setAttribute("aria-hidden", "true");
}

export function initGlossaryLinkTooltip(root: Document | HTMLElement = document) {
  const eventRoot =
    root instanceof Document ? root.documentElement : root instanceof HTMLElement ? root : null;
  const sourceDocument =
    root instanceof Document ? root : eventRoot?.ownerDocument || document;

  if (!eventRoot) {
    return () => {};
  }

  const tooltip = ensureTooltipElement();
  let activeTrigger: HTMLElement | null = null;
  let activeMessage = "";
  let suppressedTitleEntries: SuppressedTitleEntry[] = [];
  let touchPreviewTrigger: HTMLElement | null = null;

  const resolveGlossaryTrigger = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const trigger = target.closest(GLOSSARY_LINK_SELECTOR);

    if (
      !(trigger instanceof HTMLElement) ||
      !eventRoot.contains(trigger) ||
      trigger.hidden
    ) {
      return null;
    }

    return readTooltipMessage(trigger) ? trigger : null;
  };

  const resetTouchPreview = () => {
    touchPreviewTrigger = null;
  };

  const clearTooltip = ({ preserveTouchPreview = false } = {}) => {
    activeTrigger = null;
    activeMessage = "";
    if (!preserveTouchPreview) {
      resetTouchPreview();
    }
    hideTooltip(tooltip);
    restoreNativeTitles(suppressedTitleEntries);
    suppressedTitleEntries = [];
  };

  const showTooltipForTrigger = (
    trigger: HTMLElement,
    clientX: number,
    clientY: number
  ) => {
    const message = readTooltipMessage(trigger);

    if (!message) {
      clearTooltip();
      return;
    }

    if (activeTrigger !== trigger) {
      restoreNativeTitles(suppressedTitleEntries);
      suppressedTitleEntries = suppressNativeTitles([trigger]);
    }

    activeTrigger = trigger;
    activeMessage = message;
    showTooltip(tooltip, message, clientX, clientY);
  };

  const showTooltipAtTrigger = (trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    showTooltipForTrigger(trigger, rect.left + rect.width / 2, rect.bottom + 10);
  };

  const handleMouseOver = (event: MouseEvent) => {
    const trigger = resolveGlossaryTrigger(event.target);

    if (!trigger || activeTrigger === trigger) {
      return;
    }

    resetTouchPreview();
    showTooltipForTrigger(trigger, event.clientX, event.clientY);
  };

  const handleMouseMove = (event: MouseEvent) => {
    const trigger = activeTrigger || resolveGlossaryTrigger(event.target);

    if (!trigger) {
      return;
    }

    const message = readTooltipMessage(trigger);

    if (!message) {
      clearTooltip();
      return;
    }

    if (activeTrigger !== trigger || activeMessage !== message) {
      showTooltipForTrigger(trigger, event.clientX, event.clientY);
      return;
    }

    positionTooltip(tooltip, event.clientX, event.clientY);
  };

  const handleMouseOut = (event: MouseEvent) => {
    if (!activeTrigger) {
      return;
    }

    if (event.relatedTarget instanceof Node && activeTrigger.contains(event.relatedTarget)) {
      return;
    }

    const nextTrigger = resolveGlossaryTrigger(event.relatedTarget);

    if (nextTrigger) {
      return;
    }

    clearTooltip();
  };

  const handleFocusIn = (event: FocusEvent) => {
    const trigger = resolveGlossaryTrigger(event.target);

    if (!trigger) {
      return;
    }

    resetTouchPreview();
    showTooltipAtTrigger(trigger);
  };

  const handleFocusOut = (event: FocusEvent) => {
    if (!activeTrigger) {
      return;
    }

    if (event.relatedTarget instanceof Node && activeTrigger.contains(event.relatedTarget)) {
      return;
    }

    clearTooltip();
  };

  const handlePointerDown = (event: PointerEvent) => {
    const trigger = resolveGlossaryTrigger(event.target);

    if (!trigger) {
      if (activeTrigger) {
        clearTooltip();
      }
      return;
    }

    if (event.pointerType === "mouse") {
      return;
    }

    if (touchPreviewTrigger === trigger && activeTrigger === trigger) {
      clearTooltip();
      return;
    }

    event.preventDefault();
    touchPreviewTrigger = trigger;
    showTooltipAtTrigger(trigger);
  };

  const handleScroll = () => {
    if (!activeTrigger) {
      return;
    }

    clearTooltip();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      clearTooltip();
    }
  };

  const handleWindowBlur = () => {
    clearTooltip();
  };

  eventRoot.addEventListener("mouseover", handleMouseOver);
  eventRoot.addEventListener("mousemove", handleMouseMove);
  eventRoot.addEventListener("mouseout", handleMouseOut);
  eventRoot.addEventListener("focusin", handleFocusIn);
  eventRoot.addEventListener("focusout", handleFocusOut);
  eventRoot.addEventListener("pointerdown", handlePointerDown, { passive: false });
  eventRoot.addEventListener("keydown", handleKeyDown);
  sourceDocument.addEventListener("scroll", handleScroll, {
    capture: true,
    passive: true
  });
  window.addEventListener("blur", handleWindowBlur);

  return () => {
    eventRoot.removeEventListener("mouseover", handleMouseOver);
    eventRoot.removeEventListener("mousemove", handleMouseMove);
    eventRoot.removeEventListener("mouseout", handleMouseOut);
    eventRoot.removeEventListener("focusin", handleFocusIn);
    eventRoot.removeEventListener("focusout", handleFocusOut);
    eventRoot.removeEventListener("pointerdown", handlePointerDown);
    eventRoot.removeEventListener("keydown", handleKeyDown);
    sourceDocument.removeEventListener("scroll", handleScroll, { capture: true });
    window.removeEventListener("blur", handleWindowBlur);
    clearTooltip();
  };
}
