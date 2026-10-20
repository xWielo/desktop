// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

/* eslint-disable consistent-return */

export class ZenGlanceParent extends JSWindowActorParent {
  constructor() {
    super();
  }

  async receiveMessage(message) {
    switch (message.name) {
      case "ZenGlance:OpenGlance": {
        this.openGlance(this.browsingContext.topChromeWindow, message.data);
        break;
      }
      case "ZenGlance:CloseGlance": {
        // Explicitly allowlist fields from content; never forward
        // skipPermitUnload or other privileged flags.
        const { noAnimation, setNewID, hasFocused } = message.data ?? {};
        this.browsingContext.topChromeWindow.gZenGlanceManager.closeGlance({
          onTabClose: true,
          noAnimation: !!noAnimation,
          setNewID: typeof setNewID === "string" ? setNewID : null,
          hasFocused: !!hasFocused,
        });
        break;
      }
      case "ZenGlance:RecordLinkClickData": {
        const { topChromeWindow } = this.browsingContext;
        topChromeWindow.gZenGlanceManager.lastLinkClickData =
          this.#toTabPanelsCoordinates(topChromeWindow, message.data);
        break;
      }
      default:
        console.warn(`[glance]: Unknown message: ${message.name}`);
    }
  }

  /**
   * The link rect is relative to the content viewport, i.e. the origin of the
   * <browser> hosting it. Glance animates relative to the tabpanels, which only
   * matches that origin for a full-size tab. Split-view tiles sit at an offset
   * inside the tabpanels, so shift the rect by the browser's offset.
   *
   * @param {Window} topChromeWindow
   * @param {object} data - The link rect in content viewport coordinates
   * @returns {object} The link rect in tabpanels coordinates
   */
  #toTabPanelsCoordinates(topChromeWindow, data) {
    const browserRect =
      this.browsingContext.topFrameElement?.getBoundingClientRect();
    if (!browserRect) {
      return data;
    }
    const panelsRect =
      topChromeWindow.gBrowser.tabpanels.getBoundingClientRect();
    return {
      ...data,
      clientX: data.clientX + browserRect.left - panelsRect.left,
      clientY: data.clientY + browserRect.top - panelsRect.top,
    };
  }

  openGlance(window, data) {
    return window.gZenGlanceManager.openGlance(data);
  }
}
