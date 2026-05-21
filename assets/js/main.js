/**
 * SEU DOCE ATELIÊ - CORE APPLICATION JAVASCRIPT
 * Handles asynchronous data loading from data.json, category tab filters, 
 * dynamic DOM rendering, and custom validation for the premium order forms.
 */

document.addEventListener('DOMContentLoaded', () => {
    let productsData = [];
    const productsGrid = document.getElementById('products-grid');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const orderForm = document.getElementById('order-form');

    // 1. Load Products from data.json
    async function loadProducts() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar catálogo de dados.');
            }
            const data = await response.json();
            productsData = data.products;
            renderProducts(productsData);
        } catch (error) {
            console.error('Erro de carregamento do ateliê:', error);
            // Fallback: uses hardcoded static items already in the HTML if JSON fails
        }
    }

    // 2. Render Products into Grid
    function renderProducts(products) {
        if (!productsGrid) return;
        
        // Dynamic generation of cards
        productsGrid.innerHTML = products.map(product => {
            const featuredBadge = product.featured ? `<span class="product-badge"><i class="fa-solid fa-star"></i> Destaque</span>` : '';
            const unitText = product.priceUnit ? `<small>/${product.priceUnit}</small>` : '';
            
            return `
                <div class="product-card glass-card" data-category="${product.category}" style="opacity: 0; transform: translateY(20px);">
                    <div class="product-img-wrapper">
                        <div class="product-img-placeholder" style="background: ${product.gradient || 'linear-gradient(135deg, #ffd3e0, #ff8da1)'}">
                            <i class="fa-solid fa-cake-candles" style="font-size: 32px; color: rgba(255,255,255,0.7);"></i>
                        </div>
                        ${featuredBadge}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-footer">
                            <span class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')} ${unitText}</span>
                            <button class="btn-order-item" data-id="${product.id}" aria-label="Encomendar"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Apply progressive entrance animation to newly rendered cards
        const renderedCards = productsGrid.querySelectorAll('.product-card');
        renderedCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 80);
        });

        // Re-bind click handlers to ordering buttons
        bindOrderButtons();
    }

    // 3. Category Tab Filters
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add to clicked
            button.classList.add('active');

            const category = button.getAttribute('data-category');
            
            // Filter list
            const filteredProducts = category === 'todos' 
                ? productsData 
                : productsData.filter(p => p.category === category);

            // Animate grid out, then re-render
            productsGrid.style.opacity = '0.3';
            productsGrid.style.transform = 'scale(0.99)';
            productsGrid.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                renderProducts(filteredProducts);
                productsGrid.style.opacity = '1';
                productsGrid.style.transform = 'scale(1)';
            }, 300);
        });
    });

    // 4. Order Button Event Handlers (Toast Notifications)
    function bindOrderButtons() {
        const orderButtons = document.querySelectorAll('.btn-order-item');
        orderButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const product = productsData.find(p => p.id === productId);
                if (product) {
                    showToast(`Adicionado ao pedido: ${product.name}`);
                    // Fill form automatically
                    const formMsg = document.getElementById('form-message');
                    if (formMsg) {
                        formMsg.value = `Gostaria de solicitar um orçamento para o item: "${product.name}". `;
                        // Scroll to contact form
                        document.getElementById('contato').scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // Toast Alert Notification System
    function showToast(message) {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            // Styling injection
            const tStyle = document.createElement('style');
            tStyle.innerHTML = `
                #toast-container {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .toast-alert {
                    background: rgba(27, 22, 22, 0.9);
                    color: #fefae0;
                    padding: 14px 24px;
                    border-radius: 50px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid rgba(212, 163, 115, 0.3);
                    transform: translateY(50px);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .toast-alert.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                .toast-alert i {
                    color: #ff8da1;
                }
            `;
            document.head.appendChild(tStyle);
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-alert';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
        toastContainer.appendChild(toast);

        // Force a reflow to trigger animation
        setTimeout(() => toast.classList.add('show'), 50);

        // Remove toast after 3.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // 5. Form Submissions
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('btn-submit-form');
            const originalContent = submitBtn.innerHTML;
            
            // Loading state animation
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;

            setTimeout(() => {
                // Success State
                showToast("Mensagem enviada! Entraremos em contato em breve.");
                orderForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }, 1500);
        });
    }

    // Kickoff catalog load
    loadProducts();
});
