let eventBus = new Vue();
Vue.component('note-card', {
    props: {
        card: { type: Object, required: true },
        column: { type: Number, required: true }
    },
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <p>Дата создания: {{ card.createdDate }}</p>
            <p>Дэдлайн: {{ formatDeadline(card.deadline) }}</p>
            <p v-if="card.editDates.length">Даты редактирования: {{ card.editDates.join(', ') }}</p>
            <p v-if="card.status">{{ card.status }}</p><br>
            <div>
                <button v-if="column === 1 || column === 2 || column === 3" @click="editCard">Редактировать</button><br>
                <button v-if="column === 1" @click="deleteCard">Удалить</button>
            </div>
            <div v-if="column === 1">
                <button @click="moveToInProgress">В работу</button><br>
            </div>
            <div v-if="column === 2">
                <button @click="moveToTesting">На тестирование</button><br>
            </div>
            <div v-if="column === 3">
                <button @click="moveToCompleted">Выполнено</button><br>
                <button @click="moveBackToInProgress">Вернуть в работу</button>
            </div><br>
        </div>
    `,
    methods: {
        editCard() { this.$emit('edit-card', this.card); },
        deleteCard() { this.$emit('delete-card', this.card); },
        moveToInProgress() { this.$emit('move-card', this.card, 2); },
        moveToTesting() { this.$emit('move-card', this.card, 3); },
        moveToCompleted() { this.$emit('move-card', this.card, 4); },
        moveBackToInProgress() {
            const reason = prompt("Введите причину возврата:");
            if (reason) { this.$emit('move-card-back', this.card, 2, reason); }
        },
        formatDeadline(deadline) {
            const date = new Date(deadline);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
});
Vue.component('create-card', {
    template: `
        <div>
            <h3>Добавить карточку</h3>
            <input v-model="title" placeholder="Название задачи" />
            <input v-model="description" placeholder="Описание задачи" />
            <input type="datetime-local" v-model="deadline" />
            <button @click="createCard">Добавить карточку</button>
        </div>
    `,
    data() {
        return { title: '', description: '', deadline: '' };
    },
    methods: {
        createCard() {
            if (this.title.trim() && this.description.trim() && this.deadline) {
                this.$emit('card-created', { title: this.title, description: this.description, deadline: this.deadline });
                this.resetForm();
            }
        },
        resetForm() { this.title = ''; this.description = ''; this.deadline = ''; }
    }
});
Vue.component('edit-card', {
    props: { card: { type: Object, required: true } },
    template: `
        <div>
            <h3>Редактировать карточку</h3>
            <input v-model="card.title" />
            <input v-model="card.description" />
            <input type="datetime-local" v-model="card.deadline" />
            <button @click="save">Сохранить</button>
            <button @click="$emit('cancel')">Отмена</button>
        </div>
    `,
    methods: { save() { this.$emit('save', this.card); } }
});
let app = new Vue({
    el: '#app',
    data: {
        cards: [],
        nextCardId: 1,
        editingCard: null,
        searchQuery: ''
    },
    computed: {
        filteredCards() {
            return [1, 2, 3, 4].map(column => {
                return this.cards
                    .filter(card => card.column === column)
                    .filter(card => card.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
            });
        }
    },
    methods: {
        addCard(cardData) {
            const newCard = {
                id: this.nextCardId++,
                title: cardData.title,
                description: cardData.description,
                createdDate: new Date().toLocaleString(),
                deadline: cardData.deadline,
                column: 1,
                editDates: []
            };
            this.cards.push(newCard);
            this.saveData();
        },
        clearCards() {
            this.cards = [];
            this.nextCardId = 1;
            this.saveData();
        },
        editCard(card) { this.editingCard = JSON.parse(JSON.stringify(card)); },
        saveEditedCard(card) {
            const index = this.cards.findIndex(c => c.id === card.id);
            if (index !== -1) {
                card.editDates.push(new Date().toLocaleString());
                this.cards.splice(index, 1, card);
            }
            this.editingCard = null;
            this.saveData();
        },
        cancelEdit() { this.editingCard = null; },
        deleteCard(card) { this.cards = this.cards.filter(c => c.id !== card.id); this.saveData(); },
        moveCard(card, column) {
            card.column = column;
            if (column === 4) {
                const now = new Date();
                const deadline = new Date(card.deadline);
                card.status = deadline < now ? 'Просрочено' : 'Выполнено в срок';
            }
            this.saveData();
        },
        moveCardBack(card, column, reason) {
            if (column === 2) {
                card.column = column;
                card.status = `Возвращено в работу. Причина: ${reason}`;
                this.saveData();
            }
        },
        saveData() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
            localStorage.setItem('nextCardId', this.nextCardId);
        },
        loadData() {
            const savedCards = localStorage.getItem('cards');
            const savedNextCardId = localStorage.getItem('nextCardId');
            if (savedCards) { this.cards = JSON.parse(savedCards); }
            if (savedNextCardId) { this.nextCardId = parseInt(savedNextCardId, 10); }
        }
    },
    mounted() { this.loadData(); }
});