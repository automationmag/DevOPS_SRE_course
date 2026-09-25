import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";

function draw() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
  });
  var nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length) return;
  mermaid.run({ nodes: nodes });
}

if (typeof document$ !== "undefined" && document$.subscribe) {
  document$.subscribe(function () {
    draw();
  });
} else {
  document.addEventListener("DOMContentLoaded", draw);
}
