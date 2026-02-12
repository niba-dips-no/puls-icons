figma.showUI(__html__, { width: 360, height: 520, themeColors: true });

figma.ui.onmessage = (msg: { type: string; svg?: string; name?: string; width?: number; height?: number; message?: string }) => {
  if (msg.type === 'insert-icon' && msg.svg) {
    try {
      const node = figma.createNodeFromSvg(msg.svg);
      node.name = msg.name || 'Icon';

      // Position at viewport center
      const center = figma.viewport.center;
      node.x = center.x - node.width / 2;
      node.y = center.y - node.height / 2;

      // Select the inserted node
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);

      figma.notify('Inserted: ' + (msg.name || 'icon'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      figma.notify('Failed to insert icon: ' + errorMsg, { error: true });
    }
  }

  if (msg.type === 'resize' && msg.width && msg.height) {
    figma.ui.resize(msg.width, msg.height);
  }
};
