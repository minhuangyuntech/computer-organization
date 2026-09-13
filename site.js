const themeButton = document.querySelector("#toggleTheme");
const printButton = document.querySelector("#printPage");

try {
  if (localStorage.getItem("co-theme") === "dark") document.body.classList.add("dark");
} catch {
  // Storage may be unavailable for a local file or restricted browser profile.
}
themeButton?.setAttribute("aria-pressed", String(document.body.classList.contains("dark")));

themeButton?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  themeButton.setAttribute("aria-pressed", String(dark));
  try {
    localStorage.setItem("co-theme", dark ? "dark" : "light");
  } catch {
    // The current page can still switch themes without persisting the preference.
  }
});

printButton?.addEventListener("click", () => window.print());
