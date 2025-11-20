<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Catálogo | Alpha Personalize</title>
    
    <link rel="stylesheet" href="style.css">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <header>
        <div class="container header-content">
            <img src="logo.png" alt="Alpha Personalize" class="header-logo-img">
            <a href="https://wa.me/5534991405711" target="_blank" class="whatsapp-btn-header">
                <i class="fa-brands fa-whatsapp"></i> <span>Atendimento</span>
            </a>
        </div>
    </header>

    <section class="banner-area container">
        <div class="banner-slider">
            
            <img src="banner1.jpg" alt="Banner Destaque" class="banner-slide active">
            
            </div>
    </section>

    <section class="categories container">
        <button class="cat-btn active" data-id="todos">Todos</button>
        <button class="cat-btn" data-id="canecas">Canecas</button>
        <button class="cat-btn" data-id="placas">Placas Decorativas</button>
        <button class="cat-btn" data-id="papelaria">Papelaria</button>
    </section>

    <section class="tags-container container">
        <span class="tag-label"><i class="fa-solid fa-filter"></i> Filtrar:</span>
        <div class="tags-scroll">
            <button class="tag-btn active-tag" onclick="filterByTag('')">Tudo</button>
            <button class="tag-btn" onclick="filterByTag('maes')">Dia das Mães</button>
            <button class="tag-btn" onclick="filterByTag('carros')">Carros</button>
            <button class="tag-btn" onclick="filterByTag('geek')">Geek/Animes</button>
            <button class="tag-btn" onclick="filterByTag('times')">Times</button>
        </div>
    </section>

    <section class="container">
        <h2 class="section-title">🔥 Destaques</h2>
        <div id="carousel-container" class="carousel"></div>
    </section>

    <main class="container">
        <h2 class="section-title">Catálogo Completo</h2>
        <div id="products-grid" class="grid"></div>
    </main>

    <footer>
        <div class="container footer-content">
            
            <div class="footer-col">
                <img src="logo.png" alt="Alpha Logo" class="footer-logo">
                <p>Transformando ideias em presentes únicos. Personalização com qualidade e carinho.</p>
                <div class="social-links">
                    <a href="https://instagram.com/alpha_personalize" target="_blank"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://facebook.com/alpha_personalize" target="_blank"><i class="fa-brands fa-facebook"></i></a>
                    <a href="https://tiktok.com/@alpha.personalize" target="_blank"><i class="fa-brands fa-tiktok"></i></a>
                </div>
            </div>

            <div class="footer-col">
                <h4>Compra Segura</h4>
                <div class="security-badges">
                    <div class="badge"><i class="fa-solid fa-lock"></i> Site Seguro (SSL)</div>
                    <div class="badge"><i class="fa-solid fa-shield-halved"></i> Dados Protegidos</div>
                </div>
                <h4>Pagamento Facilitado</h4>
                <div class="payment-icons">
                    <i class="fa-brands fa-pix"></i>
                    <i class="fa-regular fa-credit-card"></i>
                </div>
            </div>

        </div>

        <div class="footer-bottom">
            <p>&copy; 2025 Alpha Personalize. Todos os direitos reservados.</p>
        </div>
    </footer>

    <div id="product-modal" class="modal-overlay">
        <div class="modal-content">
            <button class="close-modal" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
            <div class="modal-body">
                <div class="modal-img-container">
                    <img id="modal-img" src="" alt="Produto">
                </div>
                <div class="modal-info">
                    <span id="modal-category" class="category-tag">Categoria</span>
                    <h2 id="modal-title">Nome do Produto</h2>
                    <div id="modal-price-area" class="price-area"></div>
                    <p id="modal-desc" class="product-desc">Descrição...</p>
                    <div id="options-container" class="options-area"></div>
                    <button id="modal-whatsapp-btn" class="btn-buy modal-footer-btn">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Pedido
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>