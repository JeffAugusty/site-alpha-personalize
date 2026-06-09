/**
 * Alpha Personalize - Catálogo Premium
 * Padrão Corporativo: Modular, Seguro e Otimizado.
 *
 * Melhorias implementadas:
 * - Validação rigorosa de dados e Sanitização XSS
 * - Barra de pesquisa em tempo real com Debounce
 * - Event Delegation (Remoção de onclicks HTML)
 * - Cache de Produtos e Elementos DOM
 * - Gerenciamento de timeouts
 */

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
    // IMPORTANTE: Em produção, injetar via variáveis de ambiente
    DATO_CMS_TOKEN: '35f7f2575db5787c1dbb892ed9ac3e',
    WHATSAPP_NUMBER: '5534991405711',
    FETCH_TIMEOUT: 10000, // 10 segundos
    DEBOUNCE_DELAY: 300, // 300ms
    ANIMATION_DELAY_STEP: 0.05, // Segundos para o stagger effect
};

const STATUS_TAGS = ['✨ Sucesso', '❤️ Em Alta', '🌟 Exclusivo', '🔥 Tendência'];

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================
const APP_STATE = {
    allProducts: [],
    filteredProducts: [],
    currentCategory: 'todos',
    currentSearchTerm: '',
    currentModalProduct: null,
    currentModalImages: [],
    currentModalIndex: 0,
    selectedColor: '',
    selectedModel: '',
    isLoading: false,
    intersectionObserver: null,
};

// ============================================
// CACHE DO DOM (Performance)
// ============================================
const DOM = {
    appGrid: document.getElementById('products-grid'),
    categoriesContainer: document.getElementById('categories-container'),
    sidebarCategories: document.getElementById('sidebar-categories'),
    
    // Pesquisa
    searchInput: document.getElementById('search-input'),
    searchFeedback: document.getElementById('search-feedback'),
    
    // Modais e Menus
    modal: document.getElementById('product-modal'),
    modalTrack: document.getElementById('modal-slider-track'),
    loadingIndicator: document.getElementById('loading-indicator'),
    sidebarMenu: document.getElementById('sidebar-menu'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    
    // Botões
    menuToggleBtn: document.getElementById('btn-menu-toggle'),
    closeSidebarBtn: document.getElementById('btn-close-sidebar'),
    closeModalBtn: document.getElementById('btn-close-modal'),
    modalWhatsappBtn: document.getElementById('modal-whatsapp-btn'),
    modalPrevBtn: document.getElementById('modal-prev'),
    modalNextBtn: document.getElementById('modal-next'),
    
    // Informações do Modal
    modalTitle: document.getElementById('modal-title'),
    modalCategory: document.getElementById('modal-category'),
    modalDesc: document.getElementById('modal-desc'),
    modalPriceArea: document.getElementById('modal-price-area'),
    optionsContainer: document.getElementById('options-container'),
    photoCounter: document.getElementById('photo-counter'),
};

// ============================================
// INICIALIZAÇÃO SEGURA (DEFER FRIENDLY)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    bindEventListeners();
    loadProducts();
});

function bindEventListeners() {
    // Sidebar
    if (DOM.menuToggleBtn) DOM.menuToggleBtn.addEventListener('click', () => toggleMenu(false));
    if (DOM.closeSidebarBtn) DOM.closeSidebarBtn.addEventListener('click', () => toggleMenu(true));
    if (DOM.sidebarOverlay) DOM.sidebarOverlay.addEventListener('click', () => toggleMenu(true));

    // Modal
    if (DOM.modal) {
        DOM.modal.addEventListener('click', (e) => {
            if (e.target === DOM.modal) closeModal();
        });
    }
    if (DOM.closeModalBtn) DOM.closeModalBtn.addEventListener('click', closeModal);
    if (DOM.modalWhatsappBtn) DOM.modalWhatsappBtn.addEventListener('click', sendWhatsappMessage);
    if (DOM.modalPrevBtn) DOM.modalPrevBtn.addEventListener('click', () => changeModalSlide(-1));
    if (DOM.modalNextBtn) DOM.modalNextBtn.addEventListener('click', () => changeModalSlide(1));

    // Pesquisa com Debounce
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value);
        }, CONFIG.DEBOUNCE_DELAY));
    }

    // Acessibilidade: Tecla ESC global
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            toggleMenu(true);
        }
    });
}

// ============================================
// UTILITÁRIOS
// ============================================
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function isValidProduct(product) {
    return (
        product &&
        typeof product === 'object' &&
        product.nome &&
        Array.isArray(product.imagem) &&
        product.imagem.length > 0
    );
}

function formatPrice(price) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) return 'Consulte';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
}

function logError(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${message}`, error ? error.message : '');
}

function setLoading(isLoading) {
    APP_STATE.isLoading = isLoading;
    if (DOM.loadingIndicator) {
        DOM.loadingIndicator.classList.toggle('show', isLoading);
    }
}

function showErrorMessage(message) {
    if (DOM.appGrid) {
        DOM.appGrid.innerHTML = `
            <div style="color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 40px;">
                <p style="margin-bottom: 10px;">⚠️ ${sanitizeString(message)}</p>
                <button onclick="location.reload()" style="background: var(--accent); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Recarregar página
                </button>
            </div>
        `;
    }
}

// ============================================
// API & RENDERIZAÇÃO
// ============================================
async function loadProducts() {
    setLoading(true);

    const query = `{
        allProdutos {
            id
            nome
            preco
            precoAntigo
            categoria
            descricao
            cores
            modelos
            imagem { url title }
        }
    }`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

        const response = await fetch('https://graphql.datocms.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.DATO_CMS_TOKEN}`,
            },
            body: JSON.stringify({ query }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        const json = await response.json();
        if (json.errors) throw new Error(json.errors[0]?.message || 'Erro GraphQL');
        if (!json.data || !Array.isArray(json.data.allProdutos)) throw new Error('Resposta inválida');

        APP_STATE.allProducts = json.data.allProdutos.filter(isValidProduct);
        APP_STATE.filteredProducts = [...APP_STATE.allProducts];

        if (APP_STATE.allProducts.length === 0) throw new Error('Nenhum produto válido cadastrado.');

        generateFilters();
        renderGrid(APP_STATE.filteredProducts);

    } catch (error) {
        logError('Falha ao carregar catálogo', error);
        showErrorMessage('Erro ao carregar o catálogo. Tente novamente mais tarde.');
    } finally {
        setLoading(false);
    }
}

function handleSearch(term) {
    APP_STATE.currentSearchTerm = term.toLowerCase().trim();
    
    // Se digitou algo, remove o foco das categorias
    if (APP_STATE.currentSearchTerm !== '') {
        document.querySelectorAll('.cat-btn, .sidebar-link').forEach(btn => btn.classList.remove('active'));
    } else {
        // Se limpou a busca, volta para a categoria atual
        filterCategory(APP_STATE.currentCategory, true);
        if (DOM.searchFeedback) DOM.searchFeedback.innerText = '';
        return;
    }

    APP_STATE.filteredProducts = APP_STATE.allProducts.filter(p => {
        const nome = (p.nome || '').toLowerCase();
        const desc = (p.descricao || '').toLowerCase();
        const cat = (p.categoria || '').toLowerCase();
        
        return nome.includes(APP_STATE.currentSearchTerm) || 
               desc.includes(APP_STATE.currentSearchTerm) || 
               cat.includes(APP_STATE.currentSearchTerm);
    });

    if (DOM.searchFeedback) {
        DOM.searchFeedback.innerText = APP_STATE.filteredProducts.length > 0 
            ? `Resultados para "${sanitizeString(term)}"` 
            : `Nenhum produto encontrado para "${sanitizeString(term)}"`;
    }

    renderGrid(APP_STATE.filteredProducts);
}

// ============================================
// GERAÇÃO DE FILTROS E CATEGORIAS
// ============================================
function generateFilters() {
    if (!DOM.categoriesContainer || !DOM.sidebarCategories) return;

    const categories = new Set();
    APP_STATE.allProducts.forEach(product => {
        if (product.categoria) categories.add(product.categoria.trim());
    });

    // Reset containers
    DOM.categoriesContainer.innerHTML = '';
    DOM.sidebarCategories.innerHTML = '';

    // Função auxiliar criadora de botões
    const createBtn = (catName, isMobile) => {
        const btn = document.createElement('button');
        btn.className = isMobile ? 'sidebar-link' : 'cat-btn';
        if (catName === 'todos') btn.classList.add('active');
        btn.dataset.cat = catName;
        btn.textContent = catName === 'todos' ? 'Tudo' : sanitizeString(catName);
        
        btn.addEventListener('click', (e) => {
            if (DOM.searchInput) DOM.searchInput.value = '';
            if (DOM.searchFeedback) DOM.searchFeedback.innerText = '';
            filterCategory(e.target.dataset.cat);
        });
        
        return btn;
    };

    // Botões "Tudo"
    DOM.categoriesContainer.appendChild(createBtn('todos', false));
    DOM.sidebarCategories.appendChild(createBtn('todos', true));

    // Demais categorias
    Array.from(categories).sort().forEach(cat => {
        DOM.categoriesContainer.appendChild(createBtn(cat, false));
        DOM.sidebarCategories.appendChild(createBtn(cat, true));
    });
}

function filterCategory(category, skipRender = false) {
    if (!category) return;
    
    APP_STATE.currentCategory = category;
    APP_STATE.currentSearchTerm = ''; // Reseta pesquisa

    document.querySelectorAll('.cat-btn, .sidebar-link').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });

    if (category === 'todos') {
        APP_STATE.filteredProducts = [...APP_STATE.allProducts];
    } else {
        APP_STATE.filteredProducts = APP_STATE.allProducts.filter(
            p => p.categoria && p.categoria.trim() === category
        );
    }

    if (!skipRender) renderGrid(APP_STATE.filteredProducts);

    if (window.innerWidth < 768) toggleMenu(true);
}

// ============================================
// CONSTRUÇÃO DA GRADE
// ============================================
function renderGrid(products) {
    if (!DOM.appGrid) return;
    DOM.appGrid.innerHTML = '';

    if (products.length === 0) {
        DOM.appGrid.innerHTML = `
            <p style="color: var(--text-light); text-align: center; grid-column: 1/-1; padding: 40px 0;">
                Nenhum item encontrado nesta categoria.
            </p>
        `;
        return;
    }

    products.forEach((product, index) => {
        const currentPrice = Number(product.preco) || 0;
        const oldPrice = Number(product.precoAntigo) || 0;

        // Lógica de Pílulas de Urgência
        let pillHTML = '';
        if (oldPrice > currentPrice && currentPrice > 0) {
            pillHTML = `<span class="status-pill offer">🔥 Oferta</span>`;
        } else if (index % 4 === 0) {
            const randomTag = STATUS_TAGS[Math.floor(Math.random() * STATUS_TAGS.length)];
            pillHTML = `<span class="status-pill">${randomTag}</span>`;
        }

        // Lógica de Imagem Segura
        const imgUrl = product.imagem?.[0]?.url || 'https://via.placeholder.com/400';

        // Lógica de Preço
        let priceHTML = '';
        if (oldPrice > currentPrice && currentPrice > 0) {
            priceHTML = `
                <span class="old-price">${formatPrice(oldPrice)}</span>
                <span class="new-price">${formatPrice(currentPrice)}</span>
            `;
        } else if (currentPrice > 0) {
            priceHTML = `<span class="new-price">${formatPrice(currentPrice)}</span>`;
        } else {
            priceHTML = `<span class="new-price">Consulte</span>`;
        }

        // Construção do Card Elemento a Elemento
        const card = document.createElement('div');
        card.className = 'product-card reveal';
        card.style.transitionDelay = `${(index % 4) * CONFIG.ANIMATION_DELAY_STEP}s`;
        
        // Protege os dados atrelando a função de forma anônima e segura
        card.addEventListener('click', () => openModal(product));
        
        card.innerHTML = `
            ${pillHTML}
            <div class="img-box">
                <img src="${sanitizeString(imgUrl)}" alt="${sanitizeString(product.nome)}" loading="lazy">
            </div>
            <div class="details">
                <h3>${sanitizeString(product.nome)}</h3>
                <div class="price-area">${priceHTML}</div>
            </div>
        `;
        
        DOM.appGrid.appendChild(card);
    });

    setupIntersectionObserver();
}

function setupIntersectionObserver() {
    if (APP_STATE.intersectionObserver) {
        document.querySelectorAll('.reveal').forEach(el => APP_STATE.intersectionObserver.observe(el));
        return;
    }

    APP_STATE.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                APP_STATE.intersectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(el => APP_STATE.intersectionObserver.observe(el));
}

// ============================================
// INTERFACE DE USUÁRIO (MENU E MODAL)
// ============================================
function toggleMenu(forceClose = false) {
    if (!DOM.sidebarMenu || !DOM.sidebarOverlay) return;

    const shouldClose = forceClose || DOM.sidebarMenu.classList.contains('open');

    if (shouldClose) {
        DOM.sidebarMenu.classList.remove('open');
        DOM.sidebarOverlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
        if (DOM.menuToggleBtn) DOM.menuToggleBtn.setAttribute('aria-expanded', 'false');
    } else {
        DOM.sidebarMenu.classList.add('open');
        DOM.sidebarOverlay.classList.add('open');
        document.body.classList.add('no-scroll');
        if (DOM.menuToggleBtn) DOM.menuToggleBtn.setAttribute('aria-expanded', 'true');
    }
}

function openModal(product) {
    if (!isValidProduct(product)) return;

    APP_STATE.currentModalProduct = product;
    APP_STATE.currentModalImages = product.imagem || [];
    APP_STATE.currentModalIndex = 0;
    APP_STATE.selectedColor = '';
    APP_STATE.selectedModel = '';

    // Renderiza Galeria
    if (DOM.modalTrack) {
        DOM.modalTrack.innerHTML = '';
        APP_STATE.currentModalImages.forEach((img, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = sanitizeString(img.url);
            imgEl.alt = sanitizeString(product.nome);
            imgEl.className = `modal-slide-img ${index === 0 ? 'active' : ''}`;
            DOM.modalTrack.appendChild(imgEl);
        });
    }

    // Renderiza Informações base
    if (DOM.modalTitle) DOM.modalTitle.textContent = sanitizeString(product.nome);
    if (DOM.modalCategory) DOM.modalCategory.textContent = sanitizeString(product.categoria || 'Catálogo');
    if (DOM.modalDesc) DOM.modalDesc.textContent = sanitizeString(product.descricao || 'Produto personalizado. Entre em contato para enviar a sua ideia!');
    if (DOM.modalPriceArea) DOM.modalPriceArea.innerHTML = `<span class="new-price" style="font-size:1.8rem">${formatPrice(product.preco)}</span>`;
    
    // Controles de Galeria
    const hasMultiple = APP_STATE.currentModalImages.length > 1;
    if (DOM.photoCounter) DOM.photoCounter.textContent = `1 / ${APP_STATE.currentModalImages.length}`;
    if (DOM.modalPrevBtn) DOM.modalPrevBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (DOM.modalNextBtn) DOM.modalNextBtn.style.display = hasMultiple ? 'flex' : 'none';

    // Opções
    renderModalOptions(product);

    // Abre Modal
    if (DOM.modal) {
        DOM.modal.classList.add('open');
        DOM.modal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('no-scroll');
}

function renderModalOptions(product) {
    if (!DOM.optionsContainer) return;
    DOM.optionsContainer.innerHTML = '';

    const createOptionsGroup = (type, label, dataString) => {
        if (!dataString || typeof dataString !== 'string' || !dataString.trim()) return;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<label class="option-label">${label}</label>`;
        
        const chipContainer = document.createElement('div');
        chipContainer.className = 'chips-container';

        dataString.split(',').forEach(item => {
            const trimmedItem = item.trim();
            const btn = document.createElement('button');
            btn.className = 'option-chip';
            btn.textContent = sanitizeString(trimmedItem);
            
            btn.addEventListener('click', (e) => {
                chipContainer.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
                e.target.classList.add('selected');
                
                if (type === 'color') APP_STATE.selectedColor = trimmedItem;
                if (type === 'model') APP_STATE.selectedModel = trimmedItem;
            });
            
            chipContainer.appendChild(btn);
        });

        wrapper.appendChild(chipContainer);
        DOM.optionsContainer.appendChild(wrapper);
    };

    createOptionsGroup('color', 'Cores disponíveis:', product.cores);
    createOptionsGroup('model', 'Modelos / Tamanhos:', product.modelos);
}

function changeModalSlide(direction) {
    const slides = document.querySelectorAll('.modal-slide-img');
    if (slides.length === 0) return;

    slides[APP_STATE.currentModalIndex].classList.remove('active');
    APP_STATE.currentModalIndex = (APP_STATE.currentModalIndex + direction + slides.length) % slides.length;
    slides[APP_STATE.currentModalIndex].classList.add('active');

    if (DOM.photoCounter) {
        DOM.photoCounter.textContent = `${APP_STATE.currentModalIndex + 1} / ${slides.length}`;
    }
}

function closeModal() {
    if (DOM.modal) {
        DOM.modal.classList.remove('open');
        DOM.modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('no-scroll');
}

function sendWhatsappMessage() {
    const p = APP_STATE.currentModalProduct;
    if (!p) return;

    // Validações
    if (p.cores && p.cores.trim() && !APP_STATE.selectedColor) {
        alert('Por favor, selecione uma cor.');
        return;
    }
    if (p.modelos && p.modelos.trim() && !APP_STATE.selectedModel) {
        alert('Por favor, selecione um modelo/tamanho.');
        return;
    }

    let msg = `Olá Alpha! Tenho interesse no produto: *${sanitizeString(p.nome)}*`;
    
    if (APP_STATE.selectedColor) msg += `\n🎨 Cor: ${sanitizeString(APP_STATE.selectedColor)}`;
    if (APP_STATE.selectedModel) msg += `\n⚙️ Modelo: ${sanitizeString(APP_STATE.selectedModel)}`;
    
    msg += `\n\nGostaria de prosseguir com a minha personalização!`;

    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

// Cleanup global
window.addEventListener('beforeunload', () => {
    if (APP_STATE.intersectionObserver) {
        APP_STATE.intersectionObserver.disconnect();
    }
});