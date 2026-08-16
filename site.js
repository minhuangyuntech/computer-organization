const themeButton = document.querySelector("#toggleTheme");
const printButton = document.querySelector("#printPage");

if (localStorage.getItem("co-theme") === "dark") {
  document.body.classList.add("dark");
}

themeButton?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("co-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

printButton?.addEventListener("click", () => window.print());
