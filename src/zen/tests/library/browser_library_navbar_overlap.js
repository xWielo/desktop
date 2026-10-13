/* Any copyright is dedicated to the Public Domain.
   https://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

function visibleButtons(navBar) {
  return [...navBar.querySelectorAll("toolbarbutton")].filter(button => {
    const rect = button.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8 && rect.top < 80;
  });
}

add_task(async function test_nav_bar_stays_out_of_the_library() {
  await SpecialPowers.pushPrefEnv({
    set: [
      ["zen.library.enabled", true],
      ["zen.view.use-single-toolbar", true],
      ["zen.view.sidebar-expanded", false],
      ["zen.tabs.vertical.right-side", false],
    ],
  });

  const navBar = document.getElementById("nav-bar");
  const content = document.getElementById("zen-appcontent-wrapper");
  if (!content.contains(navBar)) {
    ok(true, "the nav bar is not in the content here, nothing can overlap");
    return;
  }

  const Library = customElements.get("zen-library");
  const before = navBar.getBoundingClientRect();
  Library.toggle("history");
  await TestUtils.waitForCondition(
    () => Library.isLibraryOpen && Library.libraryProgress === 1,
    "library is fully open"
  );

  const library = document.querySelector("zen-library").getBoundingClientRect();
  const buttons = visibleButtons(navBar);
  Assert.greater(buttons.length, 0, "the nav bar has buttons to look at");
  for (const button of buttons) {
    const left = button.getBoundingClientRect().left;
    Assert.greaterOrEqual(
      Math.round(left),
      Math.round(library.right),
      `${button.id || button.className} starts to the right of the library`
    );
  }

  Library.toggle();
  await TestUtils.waitForCondition(
    () => !Library.isLibraryOpen && Library.libraryProgress === 0,
    "library closes"
  );
  is(navBar.style.translate, "", "nothing is left moved on the nav bar");
  is(
    Math.round(navBar.getBoundingClientRect().left),
    Math.round(before.left),
    "the nav bar is back where it was"
  );
});
