const themeButton = document.querySelector("#toggleTheme");
const printButton = document.querySelector("#printPage");
const searchInput = document.querySelector("#searchInput");

if (localStorage.getItem("co-theme") === "dark") {
  document.body.classList.add("dark");
}

themeButton?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("co-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

printButton?.addEventListener("click", () => window.print());

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  const searchableItems = document.querySelectorAll("[data-search]");
  searchableItems.forEach((item) => {
    const matched = !query || item.dataset.search.includes(query) || item.textContent.toLowerCase().includes(query);
    item.hidden = !matched;
  });
});
