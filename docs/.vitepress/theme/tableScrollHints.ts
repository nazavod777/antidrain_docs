/**
 * Marks which edge of a scrolling table still hides content, so prose.css can
 * fade that edge. A phone shows no scrollbar until the reader touches the
 * table, and an overflowing one otherwise looks cut off mid-word.
 *
 * Script rather than a scroll-driven animation: Firefox has no scroll
 * timelines, and it is in the supported matrix. Without script the fades stay
 * off and the table simply scrolls, as it did before.
 */

const SCROLLER_CLASS = '.vp-table-scroll'
const SCROLLER_SELECTOR = `.vp-doc ${SCROLLER_CLASS}`
const HIDDEN_START = 'data-hidden-start'
const HIDDEN_END = 'data-hidden-end'
/** Sub-pixel layout can leave a fractional scroll range on a table that fits. */
const EDGE_TOLERANCE_PX = 1

const bound = new WeakSet<Element>()
let resizeObserver: ResizeObserver | null = null

function markEdges(scroller: HTMLElement): void {
  const frame = scroller.parentElement
  if (frame === null) return

  const hiddenEnd = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft
  frame.toggleAttribute(HIDDEN_START, scroller.scrollLeft > EDGE_TOLERANCE_PX)
  frame.toggleAttribute(HIDDEN_END, hiddenEnd > EDGE_TOLERANCE_PX)
}

function onScroll(event: Event): void {
  markEdges(event.currentTarget as HTMLElement)
}

function onResize(entries: readonly ResizeObserverEntry[]): void {
  for (const entry of entries) {
    const scroller = entry.target.closest<HTMLElement>(SCROLLER_CLASS)
    if (scroller !== null) markEdges(scroller)
  }
}

/**
 * Binds every table scroller on the current page. Call after each render of the
 * page content; a scroller already bound is left alone, and the resize
 * observer is rebuilt so the tables of a previous page are released.
 */
export function bindTableScrollHints(root: ParentNode = document): void {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(onResize)

  for (const scroller of root.querySelectorAll<HTMLElement>(SCROLLER_SELECTOR)) {
    // The table as well: its width changes when a web font lands, the box's does not.
    resizeObserver.observe(scroller)
    const table = scroller.firstElementChild
    if (table !== null) resizeObserver.observe(table)
    if (!bound.has(scroller)) {
      scroller.addEventListener('scroll', onScroll, { passive: true })
      bound.add(scroller)
    }
    markEdges(scroller)
  }
}
