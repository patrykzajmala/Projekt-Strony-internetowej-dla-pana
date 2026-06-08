const API_URL = 'api.php';

let currentDate = new Date(2026, 4, 22); // Start: Maj 2026
let eventsData = [];
let selectedDateStr = ""; 

const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const dayNames = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

document.addEventListener("DOMContentLoaded", () => {
    initCalendar();
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    document.getElementById('event-form').addEventListener('submit', saveEvent);
    
    const goBtn = document.getElementById('go-to-creator-btn');
    if (goBtn) {
        goBtn.addEventListener('click', openCreatorFromList);
    }
});

async function initCalendar() {
    await fetchEvents();
    renderCalendar();
}

async function fetchEvents() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const noCacheToken = new Date().getTime(); 

    try {
        const response = await fetch(`${API_URL}?year=${year}&month=${month}&_t=${noCacheToken}`);
        if(response.ok) {
            eventsData = await response.json();
            console.log("Pobrano świeże dane z bazy:", eventsData);
        }
    } catch (err) {
        console.error("Błąd pobierania danych:", err);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    initCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.textContent = ""; 

    document.getElementById('month-title').textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    dayNames.forEach(name => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.className = 'day-name';
        dayNameDiv.textContent = name;
        grid.appendChild(dayNameDiv);
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = String(day);
        dayCell.appendChild(dayNumber);

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = eventsData.filter(e => e.event_date.startsWith(dateStr));

        dayEvents.slice(0, 2).forEach(ev => {
            const badge = document.createElement('div');
            badge.className = `event-badge ${ev.type}`;
            badge.textContent = `${ev.type === 'spotkanie' ? '🤝' : '📋'} ${ev.title}`;
            dayCell.appendChild(badge);
        });

        if(dayEvents.length > 2) {
            const moreBadge = document.createElement('div');
            moreBadge.className = 'event-badge';
            moreBadge.style.color = '#6a737d';
            moreBadge.textContent = `+ ${dayEvents.length - 2} więcej`;
            dayCell.appendChild(moreBadge);
        }

        dayCell.addEventListener('click', () => handleDayClick(dateStr, dayEvents));
        grid.appendChild(dayCell);
    }
}

function handleDayClick(dateStr, dayEvents) {
    selectedDateStr = dateStr;
    if (dayEvents.length > 0) {
        openListModal(dayEvents);
    } else {
        openCreatorModal();
    }
}

function openListModal(events) {
    const container = document.getElementById('events-list-container');
    if (!container) return;
    container.textContent = ""; 
    
    document.getElementById('list-modal-title').textContent = `Zdarzenia z dnia ${selectedDateStr}`;

    events.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.borderLeft = ev.type === 'spotkanie' ? '4px solid #28a745' : '4px solid #f1a325';
        item.style.position = 'relative'; 
        item.style.paddingRight = '40px';  

        const title = document.createElement('div');
        title.className = 'list-item-title';
        title.textContent = `[${ev.type.toUpperCase()}] ${ev.title}`;
        item.appendChild(title);
        
        if(ev.description) {
            const desc = document.createElement('div');
            desc.style.fontSize = '13px';
            desc.style.margin = '4px 0';
            desc.textContent = ev.description;
            item.appendChild(desc);
        }

        const meta = document.createElement('div');
        meta.className = 'list-item-meta';
        const startHour = ev.event_date.split(' ')[1].substring(0, 5);
        const endHour = ev.end_date.split(' ')[1].substring(0, 5);
        meta.textContent = `Czas: ${startHour} - ${endHour}`;
        item.appendChild(meta);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'X';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.right = '10px';
        deleteBtn.style.top = '50%';
        deleteBtn.style.transform = 'translateY(-50%)';
        deleteBtn.style.background = '#d93025';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '11px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.padding = '4px 8px';
        deleteBtn.title = 'Usuń to wydarzenie';
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            deleteEvent(ev.id);  
        });
        
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });

    document.getElementById('modal-list').classList.add('active');
}

// ==========================================
// BRAKUJĄCE FUNKCJE ZARZĄDZANIA OKNAMI
// ==========================================
function openCreatorModal() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const endHours = String((now.getHours() + 1) % 24).padStart(2, '0');
    
    document.getElementById('event-date').value = `${selectedDateStr}T${currentHours}:${currentMinutes}`;
    document.getElementById('event-end-date').value = `${selectedDateStr}T${endHours}:${currentMinutes}`;
    
    document.getElementById('modal-creator').classList.add('active');
}

function openCreatorFromList() {
    closeModal('modal-list');
    openCreatorModal();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if(id === 'modal-creator') {
        document.getElementById('event-form').reset();
        const errorContainer = document.getElementById('creator-error-msg');
        if (errorContainer) {
            errorContainer.textContent = "";
        }
    }
}

// ==========================================
// FUNKCJE BAZY DANYCH (ZAPIS I USUWANIE)
// ==========================================
async function saveEvent(e) {
    e.preventDefault();

    const inputDateRaw = document.getElementById('event-date').value;
    const inputEndDateRaw = document.getElementById('event-end-date').value;
    
    const newStart = new Date(inputDateRaw).getTime();
    const newEnd = new Date(inputEndDateRaw).getTime();

    let errorContainer = document.getElementById('creator-error-msg');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'creator-error-msg';
        errorContainer.style.color = '#d93025';
        errorContainer.style.fontSize = '14px';
        errorContainer.style.fontWeight = 'bold';
        errorContainer.style.marginBottom = '12px';
        const form = document.getElementById('event-form');
        form.insertBefore(errorContainer, form.querySelector('button[type="submit"]'));
    }
    errorContainer.textContent = ""; 

    if (newEnd <= newStart) {
        errorContainer.textContent = "⚠️ Błąd: Czas zakończenia musi być późniejszy niż czas rozpoczęcia.";
        return;
    }

    const isOverlapping = eventsData.some(ev => {
        const evStart = new Date(ev.event_date.replace(' ', 'T')).getTime();
        const evEnd = new Date(ev.end_date.replace(' ', 'T')).getTime();
        return (newStart < evEnd && newEnd > evStart);
    });

    if (isOverlapping) {
        errorContainer.textContent = "⚠️ Termin zajęty! W wybranym przedziale czasowym istnieje już inne wydarzenie.";
        return; 
    }

    const payload = {
        type: document.getElementById('event-type').value,
        title: document.getElementById('event-title').value,
        event_date: inputDateRaw.replace('T', ' '),
        end_date: inputEndDateRaw.replace('T', ' '),
        description: document.getElementById('event-desc').value.trim()
    };

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeModal('modal-creator');
            await initCalendar(); 
        } else {
            console.error("Błąd zapisu na serwerze PHP");
        }
    } catch (err) {
        console.error("Błąd sieciowy fetch:", err);
    }
}

async function deleteEvent(id) {
    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeModal('modal-list'); 
            await initCalendar();     
        } else {
            console.error("Serwer PHP odrzucił żądanie usunięcia.");
        }
    } catch (err) {
        console.error("Błąd połączenia podczas usuwania:", err);
    }
}