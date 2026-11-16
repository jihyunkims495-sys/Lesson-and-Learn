"use strict";
const key = "daily-todos-v1";
const form = document.querySelector("#todo-form");
const input = document.querySelector("#title");
const list = document.querySelector("#list");
const filter = document.querySelector("#filter");
const status = document.querySelector("#status");
let todos = [];
let loadError = false;
try {
  const saved = JSON.parse(localStorage.getItem(key) || "[]");
  if (Array.isArray(saved)) {
    const ids = new Set();
    todos = saved.filter((t) => {
      const valid = t && typeof t.id === "string" && t.id.length > 0 &&
        !ids.has(t.id) && typeof t.title === "string" &&
        t.title.trim().length >= 1 && t.title.trim().length <= 120 &&
        typeof t.done === "boolean";
      if (valid) ids.add(t.id);
      return valid;
    }).map((t) => ({ id: t.id, title: t.title.trim(), done: t.done }));
    loadError = todos.length !== saved.length;
  } else loadError = true;
} catch {
  loadError = true;
}
function render() {
  const shown = todos.filter(
    (t) =>
      filter.value === "all" || (filter.value === "done" ? t.done : !t.done),
  );
  const fragment = document.createDocumentFragment();
  shown.forEach((todo) => {
    const li = document.createElement("li");
    li.dataset.id = todo.id;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", todo.title + " 완료");
    const title = document.createElement("span");
    title.textContent = todo.title;
    title.className = todo.done ? "done" : "";
    li.append(checkbox, title);
    ["edit", "delete"].forEach((action) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.action = action;
      b.textContent = action === "edit" ? "수정" : "삭제";
      b.setAttribute("aria-label", todo.title + " " + b.textContent);
      li.append(b);
    });
    fragment.append(li);
  });
  list.replaceChildren(fragment);
  status.textContent = shown.length
    ? shown.length +
      "개 표시 / " +
      todos.filter((t) => t.done).length +
      "개 완료"
    : "조회된 할 일이 없습니다.";
}
function save() {
  render();
  try {
    localStorage.setItem(key, JSON.stringify(todos));
  } catch {
    status.textContent =
      "저장 공간 부족: 새로고침하면 변경이 사라질 수 있습니다.";
  }
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title || title.length > 120) {
    input.setCustomValidity("1~120자로 입력하세요.");
    input.reportValidity();
    return;
  }
  todos = [...todos, { id: crypto.randomUUID(), title, done: false }];
  input.value = "";
  save();
  input.focus();
});
input.addEventListener("input", () => input.setCustomValidity(""));
filter.addEventListener("change", render);
// 목록 컨테이너 하나에 이벤트를 위임하여 항목마다 리스너를 만들지 않는다.
list.addEventListener("click", (e) => {
  const control = e.target.closest("[data-action]");
  if (!control) return;
  const id = control.closest("li").dataset.id;
  if (control.dataset.action === "delete")
    todos = todos.filter((t) => t.id !== id);
  if (control.dataset.action === "toggle")
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  if (control.dataset.action === "edit") {
    const current = todos.find((t) => t.id === id);
    const value = prompt("할 일 수정", current.title);
    if (value === null) return;
    if (!value.trim() || value.trim().length > 120) {
      status.textContent = "1~120자로 입력하세요.";
      return;
    }
    todos = todos.map((t) => (t.id === id ? { ...t, title: value.trim() } : t));
  }
  save();
});
render();
if (loadError) status.textContent = "저장 데이터를 읽지 못했습니다.";
