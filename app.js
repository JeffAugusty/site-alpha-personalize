const token = "35f7f2575db5787c1dbb892ed9ac3e"; 
const whatsappNumber = "5534991405711";

const grid = document.getElementById("products-grid");
const modal = document.getElementById("product-modal");

// Elementos Modal (Galeria)
const modalTrack = document.getElementById("modal-slider-track");
const modalPrev = document.getElementById("modal-prev");
const modalNext = document.getElementById("modal-next");
const photoCounter = document.getElementById("photo-counter");

// Elementos Modal (Info)
const modalTitle = document.getElementById("modal-title");
const modalCategory = document.getElementById("modal-category");
const modalPriceArea = document.getElementById("modal-price-area");
const modalDesc = document.getElementById("modal-desc");
const optionsContainer = document.getElementById("options-container");
const modalBtn = document.getElementById("modal-whatsapp-btn");

let allProducts = [];
let currentModalImages = [];
let currentModalIndex = 0;

// --- CARREGAMENTO ---
async function loadProducts() {
    grid.innerHTML = '<p style="color:white; text-align:center; width:200%; margin-top:20px;">Carregando catálogo...</p>';

    const query = `
        {
            allProdutos {
                nome, preco, precoAntigo, categoria, tags, descricao, cores, modelos, imagem { url, title }
            }
        }
    `;

    try {
        const response = await fetch("https://graphql.datocms.com/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        });

        const json = await response.json();
        if (json.errors) throw new Error(json.errors[0].message);

        allProducts = json.data.allProdutos;
        renderList(allProducts, grid);

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p style="color:white; text-align:center;">Erro ao carregar.</p>`;
    }
}

// --- RENDERIZAÇÃO DA GRADE ---
function renderList(products, container) {
    container.innerHTML = "";
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="color:#888; width:100%; text-align:center;">Vazio.</p>';
        return;
    }

    products.forEach(product => {
        const currentPrice = product.preco ? Number(product.preco) : 0;
        const oldPrice = product.precoAntigo ? Number(product.precoAntigo) : 0;
        
        let priceHTML = oldPrice > currentPrice ? 
            `<span class="old-price">R$ ${oldPrice.toFixed(2).replace('.', ',')}</span><span class="new-price">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>` : 
            (currentPrice === 0 ? `<span class="new-price" style="font-size:0.9rem">Consulte</span>` : `<span class="new-price">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>`);
        
        let discountTag = oldPrice > currentPrice ? '<span class="discount-tag">OFERTA</span>' : '';

        // Capa do produto (primeira foto)
        let imgUrl = "https://via.placeholder.com/300?text=Sem+Foto";
        if (product.imagem) {
            if (Array.isArray(product.imagem) && product.imagem.length > 0) imgUrl = product.imagem[0].url;
            else if (product.imagem.url) imgUrl = product.imagem.url;
        }

        const html = `
            <div class="product-card">
                <div class="img-box">${discountTag}<img src="${imgUrl}" alt="${product.nome}" loading="lazy"></div>
                <div class="details">
                    <h3>${product.nome || "Produto"}</h3>
                    <div class="price-area">${priceHTML}</div>
                    <button class="btn-buy" onclick='openProduct(${JSON.stringify(product).replace(/'/g, "&#39;")})'>
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// --- MODAL COM GALERIA ---
window.openProduct = function(product) {
    // 1. Prepara Galeria
    currentModalImages = [];
    if (product.imagem) {
         if (Array.isArray(product.imagem)) currentModalImages = product.imagem;
         else currentModalImages = [product.imagem];
    } else {
        currentModalImages = [{url: "https://via.placeholder.com/300", title: "Sem foto"}];
    }

    // 2. Renderiza Galeria
    modalTrack.innerHTML = "";
    currentModalImages.forEach((img, index) => {
        const imgElement = document.createElement("img");
        imgElement.src = img.url;
        imgElement.className = index === 0 ? "modal-slide-img active" : "modal-slide-img";
        imgElement.alt = product.nome;
        modalTrack.appendChild(imgElement);
    });

    // 3. Controles da Galeria
    currentModalIndex = 0;
    updateCounter();
    if (currentModalImages.length > 1) {
        modalPrev.style.display = "flex"; modalNext.style.display = "flex"; photoCounter.style.display = "block";
    } else {
        modalPrev.style.display = "none"; modalNext.style.display = "none"; photoCounter.style.display = "none";
    }

    // 4. Infos Texto
    modalTitle.innerText = product.nome;
    modalCategory.innerText = product.categoria ? product.categoria.toUpperCase() : 'GERAL';
    modalDesc.innerText = product.descricao || "Sem descrição.";

    const currentPrice = product.preco ? Number(product.preco) : 0;
    const oldPrice = product.precoAntigo ? Number(product.precoAntigo) : 0;
    if (oldPrice > currentPrice) {
        modalPriceArea.innerHTML = `<span class="old-price" style="font-size:1.1rem">R$ ${oldPrice.toFixed(2).replace('.', ',')}</span><span class="new-price" style="font-size:1.8rem">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>`;
    } else {
        modalPriceArea.innerHTML = `<span class="new-price" style="font-size:1.8rem">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>`;
    }

    // 5. Opções (Cor/Modelo)
    optionsContainer.innerHTML = ""; 
    let selectedColor = "";
    let selectedModel = "";

    function jumpToImage(keyword) {
        if (!keyword) return;
        const index = currentModalImages.findIndex(img => img.title && img.title.toLowerCase().includes(keyword.toLowerCase()));
        if (index !== -1) goToModalSlide(index);
    }

    if (product.cores) {
        const group = document.createElement('div'); group.className = 'option-group';
        group.innerHTML = `<label class="option-label">Cores disponíveis:</label>`;
        const chipsDiv = document.createElement('div'); chipsDiv.className = 'chips-container';
        product.cores.split(',').forEach(cor => {
            const btn = document.createElement('button'); btn.className = 'option-chip'; btn.innerText = cor.trim();
            btn.onclick = () => { 
                chipsDiv.querySelectorAll('.option-chip').forEach(b => b.classList.remove('selected')); 
                btn.classList.add('selected'); selectedColor = cor.trim(); jumpToImage(selectedColor);
            };
            chipsDiv.appendChild(btn);
        });
        group.appendChild(chipsDiv); optionsContainer.appendChild(group);
    }

    if (product.modelos) {
        const group = document.createElement('div'); group.className = 'option-group';
        group.innerHTML = `<label class="option-label">Modelos disponíveis:</label>`;
        const chipsDiv = document.createElement('div'); chipsDiv.className = 'chips-container';
        product.modelos.split(',').forEach(mod => {
            const btn = document.createElement('button'); btn.className = 'option-chip'; btn.innerText = mod.trim();
            btn.onclick = () => { 
                chipsDiv.querySelectorAll('.option-chip').forEach(b => b.classList.remove('selected')); 
                btn.classList.add('selected'); selectedModel = mod.trim(); jumpToImage(selectedModel);
            };
            chipsDiv.appendChild(btn);
        });
        group.appendChild(chipsDiv); optionsContainer.appendChild(group);
    }

    modalBtn.onclick = function() {
        if (product.cores && selectedColor === "") { alert("Por favor, selecione uma Cor."); return; }
        if (product.modelos && selectedModel === "") { alert("Por favor, selecione um Modelo."); return; }
        
        let msg = `Olá Alpha! Gostei do produto: *${product.nome}*`;
        if (currentPrice > 0) msg += ` (R$ ${currentPrice.toFixed(2)})`;
        if (selectedColor) msg += `\n🎨 Cor: ${selectedColor}`;
        if (selectedModel) msg += `\n⚙️ Modelo: ${selectedModel}`;
        msg += `\n\nGostaria de finalizar o pedido!`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    modal.classList.add("open");
    document.body.classList.add("no-scroll");
}

// --- NAVEGAÇÃO GALERIA MODAL ---
window.changeModalSlide = function(dir) {
    const slides = document.querySelectorAll('.modal-slide-img');
    slides[currentModalIndex].classList.remove('active');
    currentModalIndex += dir;
    if (currentModalIndex >= slides.length) currentModalIndex = 0;
    if (currentModalIndex < 0) currentModalIndex = slides.length - 1;
    slides[currentModalIndex].classList.add('active');
    updateCounter();
}

function goToModalSlide(index) {
    const slides = document.querySelectorAll('.modal-slide-img');
    if (index >= 0 && index < slides.length) {
        slides[currentModalIndex].classList.remove('active');
        currentModalIndex = index;
        slides[currentModalIndex].classList.add('active');
        updateCounter();
    }
}

function updateCounter() {
    photoCounter.innerText = `${currentModalIndex + 1} / ${currentModalImages.length}`;
}

window.closeModal = function() { 
    modal.classList.remove("open"); 
    document.body.classList.remove("no-scroll");
}
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.addEventListener("DOMContentLoaded", () => { loadProducts(); });