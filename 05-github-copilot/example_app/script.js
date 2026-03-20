'use strict';

// ─── State ──────────────────────────────────────────────────────────
let tickets = [];
let nextId = 1;
let editingId = null;

// ─── DOM References ─────────────────────────────────────────────────
const ticketForm = document.getElementById('ticket-form');
const ticketsList = document.getElementById('tickets-list');
const ticketCount = document.getElementById('ticket-count');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const modalCancel = document.getElementById('modal-cancel');

// ─── Sample Data ────────────────────────────────────────────────────
const SAMPLE_TICKETS = [
  {
    title: 'Email server not responding',
    description: 'Multiple users report they cannot send or receive emails since 9 AM. Exchange server appears to be down.',
    priority: 'Critical',
    status: 'Open',
    assignee: 'Alice Johnson',
  },
  {
    title: 'VPN connection drops frequently',
    description: 'Remote employees are experiencing intermittent VPN disconnections throughout the day, especially during video calls.',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Bob Smith',
  },
  {
    title: 'New laptop setup for onboarding',
    description: 'Set up a new Dell laptop for the incoming marketing hire starting next Monday. Install standard software suite.',
    priority: 'Medium',
    status: 'Open',
    assignee: 'Carol Davis',
  },
  {
    title: 'Printer on 3rd floor is jamming',
    description: 'The HP LaserJet on the 3rd floor keeps jamming when printing double-sided documents.',
    priority: 'Low',
    status: 'Open',
    assignee: 'Dan Wilson',
  },
  {
    title: 'Password reset request',
    description: 'User locked out of Active Directory account after too many failed login attempts. Needs password reset.',
    priority: 'Medium',
    status: 'Resolved',
    assignee: 'Eve Martinez',
  },
  {
    title: 'Software license expired — Adobe Creative Suite',
    description: 'The design team cannot use Photoshop or Illustrator. License renewal needed ASAP.',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Alice Johnson',
  },
  {
    title: 'Conference room display not working',
    description: 'The HDMI connection in Conference Room B does not display laptop screens. Adapter and cables tested.',
    priority: 'Low',
    status: 'Closed',
    assignee: 'Bob Smith',
  },
];

// ─── Initialise ─────────────────────────────────────────────────────
function init() {
  SAMPLE_TICKETS.forEach((t) => addTicket(t, true));
  renderTickets();
  ticketForm.addEventListener('submit', handleCreate);
  cancelBtn.addEventListener('click', resetForm);
  editForm.addEventListener('submit', handleEditSave);
  modalCancel.addEventListener('click', closeModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !editModal.hidden) closeModal();
  });
}

// ─── Ticket CRUD ────────────────────────────────────────────────────
function addTicket(data, silent) {
  const ticket = {
    id: nextId++,
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    status: data.status || 'Open',
    assignee: data.assignee || '',
    createdAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  if (!silent) renderTickets();
  return ticket;
}

function updateTicket(id, data) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;
  Object.assign(ticket, {
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    status: data.status,
    assignee: data.assignee,
  });
  renderTickets();
}

function closeTicket(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;
  ticket.status = 'Closed';
  renderTickets();
}

// ─── Rendering ──────────────────────────────────────────────────────
function renderTickets() {
  ticketCount.textContent = `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;

  if (tickets.length === 0) {
    ticketsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>No tickets yet. Create one above!</p>
      </div>`;
    return;
  }

  ticketsList.innerHTML = tickets
    .slice()
    .sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .map((t) => ticketCardHTML(t))
    .join('');

  // Attach event listeners
  ticketsList.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', handleTicketAction);
  });
}

function ticketCardHTML(ticket) {
  const priorityClass = ticket.priority.toLowerCase();
  const statusClass = ticket.status.toLowerCase().replace(/\s+/g, '-');
  const isClosed = ticket.status === 'Closed';

  return `
    <article class="ticket-card" role="listitem" aria-label="Ticket #${ticket.id}: ${escapeHTML(ticket.title)}">
      <div class="ticket-card-header">
        <span class="ticket-title">${escapeHTML(ticket.title)}</span>
        <span class="ticket-id">#${ticket.id}</span>
      </div>
      <p class="ticket-description">${escapeHTML(ticket.description)}</p>
      <div class="ticket-meta">
        <span class="badge badge-${priorityClass}">${escapeHTML(ticket.priority)}</span>
        <span class="badge badge-${statusClass}">${escapeHTML(ticket.status)}</span>
        ${ticket.assignee ? `<span class="badge badge-assignee">👤 ${escapeHTML(ticket.assignee)}</span>` : ''}
      </div>
      <div class="ticket-actions">
        <button class="btn btn-sm btn-primary" data-action="edit" data-id="${ticket.id}" ${isClosed ? 'disabled' : ''}>Edit</button>
        ${!isClosed ? `<button class="btn btn-sm btn-danger" data-action="close" data-id="${ticket.id}">Close</button>` : ''}
      </div>
    </article>`;
}

// ─── Form Handling ──────────────────────────────────────────────────
function handleCreate(e) {
  e.preventDefault();

  const title = document.getElementById('ticket-title');
  const description = document.getElementById('ticket-description');
  const priority = document.getElementById('ticket-priority');
  const assignee = document.getElementById('ticket-assignee');

  // Validate
  let valid = true;
  valid = validateField(title, 'title-error', 'Title is required') && valid;
  valid = validateField(description, 'description-error', 'Description is required') && valid;
  valid = validateField(priority, 'priority-error', 'Please select a priority') && valid;

  if (!valid) return;

  addTicket({
    title: title.value,
    description: description.value,
    priority: priority.value,
    assignee: assignee.value,
  });

  resetForm();
}

function validateField(el, errorId, message) {
  const value = el.value.trim();
  const errorEl = document.getElementById(errorId);
  if (!value) {
    el.classList.add('invalid');
    if (errorEl) errorEl.textContent = message;
    return false;
  }
  el.classList.remove('invalid');
  if (errorEl) errorEl.textContent = '';
  return true;
}

function resetForm() {
  ticketForm.reset();
  ticketForm.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  ticketForm.querySelectorAll('.error-message').forEach((el) => (el.textContent = ''));
}

// ─── Edit Modal ─────────────────────────────────────────────────────
function openEditModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  document.getElementById('edit-id').value = ticket.id;
  document.getElementById('edit-title').value = ticket.title;
  document.getElementById('edit-description').value = ticket.description;
  document.getElementById('edit-priority').value = ticket.priority;
  document.getElementById('edit-status').value = ticket.status;
  document.getElementById('edit-assignee').value = ticket.assignee;

  editModal.hidden = false;
  document.getElementById('edit-title').focus();
}

function closeModal() {
  editModal.hidden = true;
}

function handleEditSave(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('edit-id').value, 10);
  const title = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-description').value.trim();

  if (!title || !description) return;

  updateTicket(id, {
    title,
    description,
    priority: document.getElementById('edit-priority').value,
    status: document.getElementById('edit-status').value,
    assignee: document.getElementById('edit-assignee').value,
  });

  closeModal();
}

// ─── Ticket Action Dispatcher ───────────────────────────────────────
function handleTicketAction(e) {
  const action = e.currentTarget.dataset.action;
  const id = parseInt(e.currentTarget.dataset.id, 10);

  if (action === 'edit') openEditModal(id);
  if (action === 'close') closeTicket(id);
}

// ─── Utilities ──────────────────────────────────────────────────────
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
