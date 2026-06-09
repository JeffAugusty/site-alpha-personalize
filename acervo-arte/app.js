import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// COLOQUE SUAS CHAVES AQUI NOVAMENTE
const firebaseConfig = {
  apiKey: "AIzaSyA0rxNDLd-_ryk2AMN4QxaWRx9JBn9xkD0",
  authDomain: "catalogo-site-5d8d7.firebaseapp.com",
  projectId: "catalogo-site-5d8d7",
  storageBucket: "catalogo-site-5d8d7.firebasestorage.app",
  messagingSenderId: "844819235003",
  appId: "1:844819235003:web:b7e50f49d4c576a5e0e99e",
  measurementId: "G-YGRR3YNQQM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STATE = {
  arts: [],
  filtered: [],
  categories: { products: [], themes: [], occasions: [] }
};

const DOM = {
  searchInput: document.getElementById('searchInput'),
  productFilter: document.getElementById('productFilter'),
  themeFilter: document.getElementById('themeFilter'),
  occasionFilter: document.getElementById('occasionFilter'),
  clearFilters: document.getElementById('clearFilters'),
  copyFilterLink: document.getElementById('copyFilterLink'),
  resultCount: document.getElementById('resultCount'),
  gallery: document.getElementById('gallery'),
  emptyState: document.getElementById('emptyState'),
  
  artDialog: document.getElementById('artDialog'),
  closeDialog: document.getElementById('closeDialog'),
  dialogImage: document.getElementById('dialogImage'),
  dialogCode: document.getElementById('dialogCode'),
  dialogTitle: document.getElementById('dialogTitle'),
  dialogProduct: document.getElementById('dialogProduct'),
  dialogTheme: document.getElementById('dialogTheme'),
  dialogOccasion: document.getElementById('dialogOccasion'),
  copyArtLink: document.getElementById('copyArtLink'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg')
};

document.addEventListener('DOMContentLoaded', () => {
    loadPublicData();
    setupListeners();
});

async function loadPublicData() {
    try {
        // Carrega categorias dinâmicas do Admin
        const docSnap = await getDoc(doc(db, "configuracoes", "categorias"));
        if (docSnap.exists()) {
            STATE.categories = docSnap.data();
            populateFilters();
        }

        // Carrega as artes
        const querySnapshot = await getDocs(collection(db, "artes"));
        STATE.arts = [];
        querySnapshot.forEach((doc) => {
            STATE.arts.push({ id: doc.id, ...doc.data() });
        });
        
        applyFilters();
    } catch (error) {
        console.error("Erro de conexão:", error);
    }
}

function populateFilters() {
    const fill = (select, opts, placeholder) => {
        select.innerHTML = `<option value="">${placeholder}</option>`;
        (opts || []).forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
    };

    fill(DOM.productFilter, STATE.categories.products, 'Produto');
    fill(DOM.themeFilter, STATE.categories.themes, 'Tema');
    fill(DOM.occasionFilter, STATE.categories.occasions, 'Ocasião');
    
    // Verifica se veio algo na URL (Link copiado)
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('q')) {
        DOM.searchInput.value = urlParams.get('q');
    }
}

function applyFilters() {
    const term = DOM.searchInput.value.toLowerCase().trim();
    const prod = DOM.productFilter.value;
    const theme = DOM.themeFilter.value;
    const occ = DOM.occasionFilter.value;

    STATE.filtered = STATE.arts.filter(art => {
        const matchSearch = !term || [art.title, art.code, art.product, art.theme, art.occasion, art.style, art.tags].some(val => val && val.toLowerCase().includes(term));
        const matchProd = !prod || art.product === prod;
        const matchTheme = !theme || art.theme === theme;
        const matchOcc = !occ || art.occasion === occ;
        return matchSearch && matchProd && matchTheme && matchOcc;
    });

    renderGallery();
}

function renderGallery() {
    DOM.gallery.innerHTML = '';
    if (STATE.filtered.length === 0) {
        DOM.emptyState.classList.remove('hidden');
        DOM.resultCount.textContent = '';
        return;
    }
    DOM.emptyState.classList.add('hidden');
    DOM.resultCount.textContent = `${STATE.filtered.length} arte(s) encontrada(s)`;

    STATE.filtered.forEach(art => {
        const card = document.createElement('div');
        card.className = 'art-card';
        card.innerHTML = `
            <div class="art-img-box"><img src="${art.image}" alt="${art.title}" loading="lazy"></div>
            <div class="art-info">
                <span class="art-code">${art.code}</span>
                <h3>${art.title}</h3>
                <span class="art-tags">${art.product} • ${art.theme}</span>
            </div>
        `;
        card.addEventListener('click', () => openArtDialog(art));
        DOM.gallery.appendChild(card);
    });
}

function setupListeners() {
    DOM.searchInput.addEventListener('input', applyFilters);
    DOM.productFilter.addEventListener('change', applyFilters);
    DOM.themeFilter.addEventListener('change', applyFilters);
    DOM.occasionFilter.addEventListener('change', applyFilters);

    DOM.clearFilters.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.productFilter.value = '';
        DOM.themeFilter.value = '';
        DOM.occasionFilter.value = '';
        applyFilters();
    });

    DOM.closeDialog.addEventListener('click', () => DOM.artDialog.close());

    DOM.copyFilterLink.addEventListener('click', () => {
        const url = new URL(window.location);
        url.search = '';
        if(DOM.searchInput.value) url.searchParams.set('q', DOM.searchInput.value);
        navigator.clipboard.writeText(url.toString());
        showToast("Link da busca copiado!");
    });
}

function openArtDialog(art) {
    DOM.dialogImage.src = art.image;
    DOM.dialogCode.textContent = art.code;
    DOM.dialogTitle.textContent = art.title;
    DOM.dialogProduct.innerHTML = `<strong>Produto:</strong> ${art.product}`;
    DOM.dialogTheme.innerHTML = `<strong>Tema:</strong> ${art.theme}`;
    DOM.dialogOccasion.innerHTML = `<strong>Ocasião:</strong> ${art.occasion || 'Uso geral'}`;
    
    DOM.copyArtLink.onclick = () => {
        navigator.clipboard.writeText(`Quero fazer um pedido com a arte: ${art.code} - ${art.title}`);
        showToast("Referência copiada para área de transferência!");
    };
    
    DOM.artDialog.showModal();
}

function showToast(msg) {
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.remove('hidden');
    DOM.toast.classList.add('show');
    setTimeout(() => {
        DOM.toast.classList.remove('show');
        setTimeout(() => DOM.toast.classList.add('hidden'), 400);
    }, 3000);
}