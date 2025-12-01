const token = "35f7f2575db5787c1dbb892ed9ac3e"; 
const whatsappNumber = "5534991405711";

const grid = document.getElementById("products-grid");
const modal = document.getElementById("product-modal");

// Elementos Modal
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalCategory = document.getElementById("modal-category");
const modalPriceArea = document.getElementById("modal-price-area");
const modalDesc = document.getElementById("modal-desc");
const optionsContainer = document.getElementById("options-container");
const modalBtn = document.getElementById("modal-whatsapp-btn");

let allProducts = [];

async function loadProducts() {
    grid.innerHTML = '<p style="color:white; text-align:center; width:200%;">Carregando catálogo...</p>';

    const query = `
        {
            allProdutos {
                nome
                preco
                precoAntigo
                categoria
                tags
                descricao
                cores
                modelos
                imagem {
                    url
                    title
                }
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

        // Apenas desenha a grade principal
        renderList(allProducts, grid);

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p style="color:white; text-align:center;">Erro ao carregar.</p>`;
    }
}

function renderList(products, container) {
    container.innerHTML = "";
    if (!products || products.length === 0) {
        container.innerHTML = '<p style="color:#888; width:100%; text-align:center;">Vazio.</p>';
        return;
    }

    products.forEach(product => {
        const currentPrice = product.preco ? Number(product.preco) : 0;
        const oldPrice = product.precoAntigo ? Number(product.precoAntigo) : 0;
        
        let priceHTML = '';
        let discountTag = '';

        if (oldPrice > currentPrice) {
            priceHTML = `
                <span class="old-price">R$ ${oldPrice.toFixed(2).replace('.', ',')}</span>
                <span class="new-price">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>
            `;
            discountTag = '<span class="discount-tag">OFERTA</span>';
        } else {
            priceHTML = currentPrice === 0 
                ? `<span class="new-price" style="font-size:0.9rem">Consulte</span>`
                : `<span class="new-price">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>`;
        }

        let imgUrl = "https://via.placeholder.com/300?text=Sem+Foto";
        if (product.imagem) {
            if (Array.isArray(product.imagem) && product.imagem.length > 0) imgUrl = product.imagem[0].url;
            else if (product.imagem.url) imgUrl = product.imagem.url;
        }

        const html = `
            <div class="product-card">
                <div class="img-box">
                    ${discountTag}
                    <img src="${imgUrl}" alt="${product.nome}" loading="lazy">
                </div>
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

// --- MODAL INTELIGENTE (COM TROCA DE FOTO) ---
window.openProduct = function(product) {
    let gallery = []; 
    let defaultImg = "https://via.placeholder.com/300";

    if (product.imagem) {
         if (Array.isArray(product.imagem)) {
             defaultImg = product.imagem[0].url;
             gallery = product.imagem;
         } else {
             defaultImg = product.imagem.url;
             gallery = [product.imagem];
         }
    }
    
    modalImg.src = defaultImg;
    modalTitle.innerText = product.nome;
    modalCategory.innerText = product.categoria ? product.categoria.toUpperCase() : 'GERAL';
    modalDesc.innerText = product.descricao || "Sem descrição.";

    const currentPrice = product.preco ? Number(product.preco) : 0;
    const oldPrice = product.precoAntigo ? Number(product.precoAntigo) : 0;
    if (oldPrice > currentPrice) {
        modalPriceArea.innerHTML = `
            <span class="old-price" style="font-size:1.1rem">R$ ${oldPrice.toFixed(2).replace('.', ',')}</span>
            <span class="new-price" style="font-size:1.8rem">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>
        `;
    } else {
        modalPriceArea.innerHTML = `<span class="new-price" style="font-size:1.8rem">R$ ${currentPrice.toFixed(2).replace('.', ',')}</span>`;
    }

    optionsContainer.innerHTML = ""; 
    let selectedColor = "";
    let selectedModel = "";

    function tryUpdateImage() {
        if (gallery.length === 0) return;
        let foundImg = null;

        if (selectedColor && selectedModel) {
            foundImg = gallery.find(img => 
                img.title && 
                img.title.toLowerCase().includes(selectedColor.toLowerCase()) &&
                img.title.toLowerCase().includes(selectedModel.toLowerCase())
            );
        }
        if (!foundImg && selectedColor) {
            foundImg = gallery.find(img => 
                img.title && img.title.toLowerCase().includes(selectedColor.toLowerCase())
            );
        }
        if (!foundImg && selectedModel) {
            foundImg = gallery.find(img => 
                img.title && img.title.toLowerCase().includes(selectedModel.toLowerCase())
            );
        }
        if (foundImg) {
            modalImg.src = foundImg.url;
        }
    }

    if (product.cores) {
        const group = document.createElement('div');
        group.className = 'option-group';
        group.innerHTML = `<label class="option-label">Cores disponíveis:</label>`;
        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'chips-container';

        product.cores.split(',').forEach(cor => {
            const corLimpa = cor.trim();
            const btn = document.createElement('button');
            btn.className = 'option-chip';
            btn.innerText = corLimpa;
            
            btn.onclick = () => {
                chipsDiv.querySelectorAll('.option-chip').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedColor = corLimpa;
                tryUpdateImage();
            };
            chipsDiv.appendChild(btn);
        });
        group.appendChild(chipsDiv);
        optionsContainer.appendChild(group);
    }

    if (product.modelos) {
        const group = document.createElement('div');
        group.className = 'option-group';
        group.innerHTML = `<label class="option-label">Modelos disponíveis:</label>`;
        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'chips-container';

        product.modelos.split(',').forEach(mod => {
            const modLimpo = mod.trim();
            const btn = document.createElement('button');
            btn.className = 'option-chip';
            btn.innerText = modLimpo;
            
            btn.onclick = () => {
                chipsDiv.querySelectorAll('.option-chip').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedModel = modLimpo;
                tryUpdateImage();
            };
            chipsDiv.appendChild(btn);
        });
        group.appendChild(chipsDiv);
        optionsContainer.appendChild(group);
    }

    modalBtn.onclick = function() {
        if (product.cores && selectedColor === "") {
            alert("Por favor, selecione uma Cor."); return;
        }
        if (product.modelos && selectedModel === "") {
            alert("Por favor, selecione um Modelo."); return;
        }

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

window.closeModal = function() { 
    modal.classList.remove("open"); 
    document.body.classList.remove("no-scroll");
}
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// Banner Slider
let currentSlide = 0;
let slideInterval;
function initBannerSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    if (slides.length < 2) return;
    startSlideTimer();
}
window.changeSlide = function(dir) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    if(dots[currentSlide]) dots[currentSlide].classList.remove('active');
    
    currentSlide = currentSlide + dir;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    
    slides[currentSlide].classList.add('active');
    if(dots[currentSlide]) dots[currentSlide].classList.add('active');
    resetSlideTimer();
}
window.goToSlide = function(idx) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    if(dots[currentSlide]) dots[currentSlide].classList.remove('active');
    
    currentSlide = idx;
    slides[currentSlide].classList.add('active');
    if(dots[currentSlide]) dots[currentSlide].classList.add('active');
    resetSlideTimer();
}
function startSlideTimer() { slideInterval = setInterval(() => window.changeSlide(1), 4000); }
function resetSlideTimer() { clearInterval(slideInterval); startSlideTimer(); }

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    initBannerSlider();
});