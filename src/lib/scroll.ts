/** Scrolls the page to the top. On phones the page scrolls inside #root (see index.css), elsewhere the window. */
export function scrollToTop(smooth = true) {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  document.getElementById('root')?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}
