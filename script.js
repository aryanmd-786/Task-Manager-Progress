// DOM Elements
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const taskTemplate = document.getElementById('task-template');
const progressBar = document.getElementById('progress');
const progressPercent = document.getElementById('progress-percent');

// State
let tasks = [];
let currentFilter = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    updateOverallProgress();
    setMinDate();
});

// Set minimum date to today for due date input
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-due-date').min = today;
}

// Event Listeners
function setupEventListeners() {
    // Form submission
    taskForm.addEventListener('submit', handleAddTask);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn));
    });
    
    // Event delegation for dynamic elements
    taskList.addEventListener('click', handleTaskActions);
    taskList.addEventListener('change', handleProgressChange);
}

// Handle adding a new task
function handleAddTask(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('task-due-date');
    const priorityInput = document.getElementById('task-priority');
    
    const task = {
        id: Date.now().toString(),
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: priorityInput.value,
        progress: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    if (task.title) {
        tasks.push(task);
        saveTasks();
        renderTasks();
        updateOverallProgress();
        taskForm.reset();
    }
}

// Handle task actions (delete, edit)
function handleTaskActions(e) {
    const taskElement = e.target.closest('.task');
    if (!taskElement) return;
    
    const taskId = taskElement.dataset.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (e.target.closest('.btn-delete')) {
        // Delete task
        tasks.splice(taskIndex, 1);
        saveTasks();
        renderTasks();
        updateOverallProgress();
    } 
    else if (e.target.closest('.btn-edit')) {
        // Edit task
        const task = tasks[taskIndex];
        populateEditForm(task);
    }
}

// Populate form for editing a task
function populateEditForm(task) {
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('task-due-date');
    const priorityInput = document.getElementById('task-priority');
    
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    dueDateInput.value = task.dueDate || '';
    priorityInput.value = task.priority;
    
    // Remove the task being edited
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks();
    renderTasks();
    
    // Scroll to form
    document.querySelector('.add-task').scrollIntoView({ behavior: 'smooth' });
}

// Handle progress change for a task
function handleProgressChange(e) {
    if (e.target.classList.contains('progress-select')) {
        const taskElement = e.target.closest('.task');
        const taskId = taskElement.dataset.id;
        const progress = parseInt(e.target.value);
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.progress = progress;
            task.status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending';
            saveTasks();
            updateTaskStatus(taskElement, task.status);
            updateOverallProgress();
        }
    }
}

// Update task status in the UI
function updateTaskStatus(element, status) {
    element.setAttribute('data-status', status);
}

// Handle filter button clicks
function handleFilterClick(button) {
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Set current filter and re-render
    currentFilter = button.dataset.filter;
    renderTasks();
}

// Filter tasks based on current filter
function filterTasks() {
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(task => task.status === 'pending');
        case 'in-progress':
            return tasks.filter(task => task.status === 'in-progress');
        case 'completed':
            return tasks.filter(task => task.status === 'completed');
        default:
            return [...tasks];
    }
}

// Render tasks to the DOM
function renderTasks() {
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found. ${currentFilter === 'all' ? 'Add a new task to get started!' : 'Try changing your filter.'}</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = '';
    
    // Sort tasks by priority (high to low) and then by due date (ascending)
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// Create a task element from template
function createTaskElement(task) {
    const clone = taskTemplate.content.cloneNode(true);
    const taskElement = clone.querySelector('.task');
    
    taskElement.dataset.id = task.id;
    taskElement.dataset.priority = task.priority;
    taskElement.dataset.status = task.status;
    
    // Set task content
    taskElement.querySelector('.task-title').textContent = task.title;
    
    const descriptionElement = taskElement.querySelector('.task-description');
    descriptionElement.textContent = task.description || 'No description';
    
    // Set priority
    const priorityElement = taskElement.querySelector('.task-priority');
    priorityElement.textContent = task.priority;
    
    // Set due date
    const dueDateElement = taskElement.querySelector('.task-due');
    if (task.dueDate) {
        const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        dueDateElement.innerHTML = `<i class="far fa-calendar-alt"></i> Due: ${formattedDate}`;
    } else {
        dueDateElement.innerHTML = '<i class="far fa-calendar-alt"></i> No due date';
    }
    
    // Set progress
    const progressSelect = taskElement.querySelector('.progress-select');
    progressSelect.value = task.progress;
    
    return taskElement;
}

// Update overall progress
function updateOverallProgress() {
    if (tasks.length === 0) {
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        progressPercent.textContent = '0%';
        return;
    }
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = Math.round(totalProgress / tasks.length);
    
    progressBar.style.width = `${averageProgress}%`;
    progressBar.textContent = `${averageProgress}%`;
    progressPercent.textContent = `${averageProgress}%`;
    
    // Update progress bar color based on completion
    if (averageProgress < 30) {
        progressBar.style.background = '#dc3545'; // Red
    } else if (averageProgress < 70) {
        progressBar.style.background = '#ffc107'; // Yellow
    } else {
        progressBar.style.background = '#28a745'; // Green
    }
}

// Save tasks to local storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}
