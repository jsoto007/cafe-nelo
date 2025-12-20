const TYPING_SELECTOR = 'input, textarea, select, [contenteditable="true"], [role="textbox"]';

export function shouldIgnoreHotkeys(event) {
  if (!event || event.defaultPrevented) {
    return true;
  }

  if (event.isComposing) {
    return true;
  }

  const { target } = event;
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest(TYPING_SELECTOR));
}
