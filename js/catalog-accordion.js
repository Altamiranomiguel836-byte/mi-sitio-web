(function () {
  document.querySelectorAll(".catalog-grid").forEach(function (grid) {
    grid.querySelectorAll("details.catalog-expand").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (!details.open) return;
        grid.querySelectorAll("details.catalog-expand").forEach(function (other) {
          if (other !== details) other.removeAttribute("open");
        });
      });
    });
  });
})();
