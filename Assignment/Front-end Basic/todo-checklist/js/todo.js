let editingItem = null;
const form = document.getElementById("todo-form");
const todoList = document.getElementById("todo-list");
const titleInput = document.getElementById("todo-title");
const contentInput = document.getElementById("todo-content");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");

function saveTodo() {
  const item = editingItem || document.createElement("li");
  if (editingItem === null) {
    item.className = "todo-item";
    item.innerHTML = `<label class="todo-check"><input type="checkbox" onclick="checkTodo(this)"><span><span class="todo-title"></span><span class="todo-content"></span></span></label><div class="todo-actions"><button type="button" class="btn" onclick="editTodo(this)">수정</button><button type="button" class="btn btn-danger" onclick="deleteTodo(this)">삭제</button></div>`;
    todoList.append(item);
  }
  item.querySelector(".todo-title").textContent = titleInput.value;
  item.querySelector(".todo-content").textContent = contentInput.value;
  resetForm();
  return false;
}

function checkTodo(checkbox) {
  checkbox.closest(".todo-item").classList.toggle("done", checkbox.checked);
}

function editTodo(button) {
  editingItem = button.closest(".todo-item");
  titleInput.value = editingItem.querySelector(".todo-title").textContent;
  contentInput.value = editingItem.querySelector(".todo-content").textContent;
  formTitle.textContent = "일정 수정";
  submitButton.textContent = "저장";
}

function deleteTodo(button) {
  const item = button.closest(".todo-item");
  if (editingItem === item) resetForm();
  item.remove();
}

function resetForm() {
  editingItem = null;
  form.reset();
  formTitle.textContent = "일정 추가";
  submitButton.textContent = "추가";
}

function filterTodos(button) {
  todoList.dataset.filter = button.dataset.filter;
  document.querySelector(".is-active").classList.remove("is-active");
  button.classList.add("is-active");
}
