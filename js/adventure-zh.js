(() => {
  const rules = [
    [/Fire Rift Expedition/g, '\u7194\u706b\u88c2\u8c37\u9060\u5f81'], [/FIRE RIFT/g, '\u7194\u706b\u88c2\u8c37'], [/Begin Expedition/g, '\u958b\u59cb\u9060\u5f81'], [/Your party/g, '\u4f60\u7684\u968a\u4f0d'], [/New Run/g, '\u91cd\u65b0\u958b\u5c40'],
    [/Rift Gate/g, '\u88c2\u8c37\u4e4b\u9580'], [/Cinder Pack/g, '\u7070\u71fc\u7375\u7fa4'], [/Ember Cache/g, '\u9918\u71fc\u5bf6\u7bb1'], [/Ash Camp/g, '\u7070\u71fc\u71df\u5730'], [/Magma Guard/g, '\u7194\u5ca9\u5b88\u885b'], [/Ancient Forge/g, '\u9060\u53e4\u7194\u7210'], [/Flame Vanguard/g, '\u70c8\u7130\u5148\u92d2'], [/Rift Warden/g, '\u88c2\u8c37\u5b88\u885b\u8005'],
    [/Your turn/g, '\u6211\u65b9\u884c\u52d5'], [/Enemy turn/g, '\u6575\u65b9\u884c\u52d5'], [/Auto Battle/g, '\u81ea\u52d5\u6230\u9b25'], [/Auto running/g, '\u81ea\u52d5\u6230\u9b25\u4e2d'], [/power skill/g, '\u5f37\u529b\u6280\u80fd'], [/cooldown /g, '\u51b7\u537b '], [/resolve this encounter/g, '\u81ea\u52d5\u5b8c\u6210\u9019\u5834\u6230\u9b25'],
    [/Move forward/g, '\u5411\u524d\u63a8\u9032'], [/Continue/g, '\u7e7c\u7e8c'], [/Collect/g, '\u9818\u53d6'], [/Rest/g, '\u4f11\u606f'], [/Victory/g, '\u52dd\u5229'], [/Party restored/g, '\u968a\u4f0d\u5df2\u56de\u5fa9'], [/Supplies secured/g, '\u88dc\u7d66\u5df2\u53d6\u5f97'], [/Expedition failed/g, '\u9060\u5f81\u5931\u6557'], [/Try again/g, '\u518d\u8a66\u4e00\u6b21'],
    [/Gold/g, '\u91d1\u5e63'], [/Embers/g, '\u9918\u71fc'], [/Next:/g, '\u4e0b\u4e00\u7ad9\uff1a'], [/clear/g, '\u5df2\u5b8c\u6210'], [/enter/g, '\u9032\u5165'], [/locked/g, '\u672a\u89e3\u9396'], [/Rift Encounter/g, '\u88c2\u8c37\u906d\u9047\u6230']
  ];
  function localize(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((text) => { let value = text.nodeValue; rules.forEach(([from, to]) => { value = value.replace(from, to); }); text.nodeValue = value; });
  }
  localize();
  new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => { if (node.nodeType === Node.ELEMENT_NODE) localize(node); else if (node.nodeType === Node.TEXT_NODE) localize(node.parentElement); }))).observe(document.body, { childList: true, subtree: true });
})();
