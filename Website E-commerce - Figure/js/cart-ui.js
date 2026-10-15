/**
 * Action Figure Store - Cart UI Controller (cart-ui.js)
 * 
 * Tanggung Jawab Modul:
 * 1. Mengelola tampilan panel samping (drawer) keranjang belanja.
 * 2. Memperbarui badge jumlah item di navbar secara seketika (real-time).
 * 3. Menampilkan daftar item, subtotal, total harga, tombol +, -, dan hapus.
 * 4. Menampilkan notifikasi popup (toast) saat item ditambahkan atau stok habis.
 * 5. Menangani tampilan keranjang kosong beserta tombol "Lanjut Belanja".
 * 6. Menangani tampilan checkout mock lengkap dengan ringkasan dan konfirmasi pesanan.
 * 7. Menghubungkan semua tombol "Tambah ke Keranjang" di halaman ke CartStore.
 */

(function () {
  'use strict';

  // Pastikan CartStore sudah dimuat
  if (!window.cartStore) {
    console.error('[CartUI] CartStore belum tersedia. Pastikan cart.js dimuat sebelum cart-ui.js.');
    return;
  }

  const { cartStore, PRODUCTS_DATA } = window;

  /**
   * Menginisialisasi komponen UI di DOM
   */
  function initCartUI() {
    ensureNavbarCartButton();
    ensureCartDrawerMarkup();
    ensureToastContainer();
    ensureCheckoutModalMarkup();
    attachProductButtons();
    
    // Daftarkan listener agar UI terupdate otomatis saat CartStore berubah
    cartStore.subscribe(renderCart);

    // Render pertama kali berdasarkan data yang tersimpan
    renderCart(cartStore.getCart());
  }

  /**
   * 1. Menambahkan tombol dan badge keranjang di navbar jika belum ada
   */
  function ensureNavbarCartButton() {
    const navContainers = document.querySelectorAll('header .main-header nav');
    if (!navContainers.length) return;

    // Ambil elemen nav terdalam
    const lastNav = navContainers[navContainers.length - 1];
    
    let cartBtn = document.getElementById('open-cart-btn');
    if (!cartBtn) {
      cartBtn = document.createElement('a');
      cartBtn.id = 'open-cart-btn';
      cartBtn.className = 'nav-cart-link';
      cartBtn.href = 'javascript:void(0)';
      cartBtn.title = 'Keranjang Belanja';
      cartBtn.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <span>Keranjang</span>
        <span class="cart-badge" id="cart-badge">0</span>
      `;
      lastNav.appendChild(cartBtn);
    }

    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  /**
   * 2. Membuat markup Panel Drawer Keranjang dan Backdrop
   */
  function ensureCartDrawerMarkup() {
    if (document.getElementById('cart-drawer')) return;

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'cart-backdrop';
    backdrop.className = 'cart-backdrop';
    backdrop.addEventListener('click', closeCartDrawer);

    // Drawer Panel
    const drawer = document.createElement('aside');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.setAttribute('aria-label', 'Panel Keranjang Belanja');
    drawer.innerHTML = `
      <div class="cart-header">
        <h3 class="cart-header-title">
          <i class="fas fa-shopping-bag"></i>
          <span>Keranjang Belanja</span>
          <span class="cart-count-pill" id="cart-drawer-count">0 item</span>
        </h3>
        <button class="cart-close-btn" id="close-cart-btn" title="Tutup Keranjang">&times;</button>
      </div>

      <div class="cart-body" id="cart-items-container">
        <!-- Item keranjang atau tampilan kosong akan dirender di sini -->
      </div>

      <div class="cart-footer" id="cart-footer-panel">
        <div class="cart-summary-row">
          <span class="cart-summary-label">Total Barang</span>
          <span class="cart-summary-val" id="cart-total-qty">0 pcs</span>
        </div>
        <div class="cart-total-row">
          <span class="cart-total-label">Total Harga:</span>
          <span class="cart-total-val" id="cart-total-price">Rp 0</span>
        </div>
        <div class="cart-actions-row">
          <button class="btn-clear-cart" id="btn-clear-cart" title="Kosongkan Keranjang">
            <i class="fas fa-trash-alt"></i> Kosongkan
          </button>
          <button class="btn-checkout" id="btn-checkout" title="Lanjut ke Checkout">
            <i class="fas fa-credit-card"></i> Checkout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    // Listener tombol tutup
    document.getElementById('close-cart-btn').addEventListener('click', closeCartDrawer);

    // Listener tombol kosongkan keranjang
    document.getElementById('btn-clear-cart').addEventListener('click', handleClearCart);

    // Listener tombol checkout
    document.getElementById('btn-checkout').addEventListener('click', openCheckoutModal);
  }

  /**
   * 3. Membuat Container untuk Toast Notifications
   */
  function ensureToastContainer() {
    if (document.getElementById('toast-container')) return;

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  /**
   * Menampilkan Toast Notification
   * @param {string} message 
   * @param {'success'|'warning'|'info'} type 
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconHtml = '<i class="fas fa-check-circle"></i>';
    if (type === 'warning') iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
    if (type === 'info') iconHtml = '<i class="fas fa-info-circle"></i>';

    toast.innerHTML = `
      ${iconHtml}
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Animasi masuk
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Otomatis hilang setelah 3.2 detik
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 3200);
  }

  /**
   * 4. Membuat Modal Mock Checkout
   */
  function ensureCheckoutModalMarkup() {
    if (document.getElementById('checkout-modal-backdrop')) return;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'checkout-modal-backdrop';
    modalBackdrop.className = 'checkout-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="checkout-modal" role="dialog" aria-modal="true">
        <div class="checkout-modal-header">
          <h3><i class="fas fa-shield-alt"></i> Checkout Pesanan</h3>
          <button class="cart-close-btn" id="close-checkout-btn">&times;</button>
        </div>
        <div class="checkout-modal-body" id="checkout-modal-body">
          <div class="checkout-section-title">Ringkasan Pesanan</div>
          <div class="checkout-items-preview" id="checkout-items-preview">
            <!-- Ringkasan item -->
          </div>

          <form id="checkout-form" onsubmit="return false;">
            <div class="checkout-section-title">Data Pengiriman</div>
            <div class="checkout-form-group">
              <label for="buyer-name">Nama Penerima</label>
              <input type="text" id="buyer-name" placeholder="Contoh: Rian Pratama" required value="Anime Collector" />
            </div>
            <div class="checkout-form-group">
              <label for="buyer-phone">No. WhatsApp / Telepon</label>
              <input type="tel" id="buyer-phone" placeholder="Contoh: 08123456789" required value="08123456789" />
            </div>
            <div class="checkout-form-group">
              <label for="buyer-address">Alamat Pengiriman</label>
              <textarea id="buyer-address" rows="2" placeholder="Alamat lengkap tujuan pengiriman..." required>Jl. Gatot Subroto No. 45, Denpasar, Bali</textarea>
            </div>
            <div class="checkout-form-group">
              <label for="buyer-payment">Metode Pembayaran</label>
              <select id="buyer-payment">
                <option value="bca">Transfer Bank BCA</option>
                <option value="mandiri">Transfer Bank Mandiri</option>
                <option value="gopay">E-Wallet GoPay / OVO / Dana</option>
                <option value="cod">COD (Bayar di Tempat)</option>
              </select>
            </div>
          </form>
        </div>
        <div class="checkout-modal-footer" id="checkout-modal-footer">
          <div class="checkout-total-display">
            <span class="checkout-total-label">Total Pembayaran</span>
            <span class="checkout-total-amount" id="checkout-total-amount">Rp 0</span>
          </div>
          <button class="btn-confirm-order" id="btn-confirm-order">
            <i class="fas fa-check"></i> Konfirmasi Pesanan
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Listeners
    document.getElementById('close-checkout-btn').addEventListener('click', closeCheckoutModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeCheckoutModal();
    });
    document.getElementById('btn-confirm-order').addEventListener('click', handleConfirmOrder);
  }

  /**
   * Buka Panel Keranjang
   */
  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('open');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Mencegah scrolling halaman latar
    }
  }

  /**
   * Tutup Panel Keranjang
   */
  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('open');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Buka Modal Checkout
   */
  function openCheckoutModal() {
    const cart = cartStore.getCart();
    if (!cart.length) {
      showToast('Keranjang Anda masih kosong!', 'warning');
      return;
    }

    closeCartDrawer();

    const backdrop = document.getElementById('checkout-modal-backdrop');
    const previewContainer = document.getElementById('checkout-items-preview');
    const totalAmount = document.getElementById('checkout-total-amount');

    // Render ringkasan item checkout
    previewContainer.innerHTML = cart.map(item => `
      <div class="checkout-preview-item">
        <span><strong>${item.name}</strong> (${item.qty}x)</span>
        <span>${CartStore.formatRupiah(item.price * item.qty)}</span>
      </div>
    `).join('');

    totalAmount.textContent = CartStore.formatRupiah(cartStore.getTotalPrice());

    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Tutup Modal Checkout
   */
  function closeCheckoutModal() {
    const backdrop = document.getElementById('checkout-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Menangani Konfirmasi Pesanan (Mock Checkout)
   */
  function handleConfirmOrder() {
    const modalBody = document.getElementById('checkout-modal-body');
    const modalFooter = document.getElementById('checkout-modal-footer');
    const orderId = 'AF-' + Math.floor(100000 + Math.random() * 900000);
    const totalPaid = CartStore.formatRupiah(cartStore.getTotalPrice());

    modalBody.innerHTML = `
      <div class="order-success-box">
        <div class="order-success-icon"><i class="fas fa-check"></i></div>
        <h4>Pesanan Berhasil Diterima!</h4>
        <p>Terima kasih telah berbelanja di <strong>Action Figure Anime Shop</strong>. Kami akan segera memproses dan mengirimkan pesanan Anda.</p>
        <div class="order-id-badge">ID Pesanan: #${orderId}</div>
        <p style="font-weight: 700; color: #2e7d32;">Total Tagihan: ${totalPaid}</p>
      </div>
    `;

    modalFooter.innerHTML = `
      <button class="btn-confirm-order" style="width: 100%; justify-content: center;" id="btn-order-finish">
        <i class="fas fa-store"></i> Selesai & Kembali Belanja
      </button>
    `;

    document.getElementById('btn-order-finish').addEventListener('click', () => {
      cartStore.clearCart();
      closeCheckoutModal();
      showToast('Terima kasih atas pesanan Anda!', 'success');
      // Reset modal konten setelah ditutup
      setTimeout(() => {
        const backdrop = document.getElementById('checkout-modal-backdrop');
        if (backdrop) backdrop.remove();
        ensureCheckoutModalMarkup();
      }, 500);
    });
  }

  /**
   * Menangani Pengosongan Keranjang
   */
  function handleClearCart() {
    const cart = cartStore.getCart();
    if (!cart.length) return;

    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?')) {
      cartStore.clearCart();
      showToast('Keranjang belanja berhasil dikosongkan.', 'info');
    }
  }

  /**
   * Merender Isi Keranjang, Total Harga, dan Badge Navbar
   * @param {Array} cart 
   */
  function renderCart(cart) {
    const totalCount = cartStore.getTotalCount();
    const totalPrice = cartStore.getTotalPrice();

    // 1. Update Badge Navbar dengan animasi pop
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = totalCount;
      badge.classList.add('pop');
      setTimeout(() => badge.classList.remove('pop'), 250);
    }

    // 2. Update Header & Footer Info Drawer
    const drawerCount = document.getElementById('cart-drawer-count');
    if (drawerCount) drawerCount.textContent = `${totalCount} item`;

    const totalQtyEl = document.getElementById('cart-total-qty');
    if (totalQtyEl) totalQtyEl.textContent = `${totalCount} pcs`;

    const totalPriceEl = document.getElementById('cart-total-price');
    if (totalPriceEl) totalPriceEl.textContent = CartStore.formatRupiah(totalPrice);

    // 3. Render Daftar Item di Body
    const container = document.getElementById('cart-items-container');
    const footerPanel = document.getElementById('cart-footer-panel');
    if (!container) return;

    if (!cart || cart.length === 0) {
      // Tampilan Keranjang Kosong
      if (footerPanel) footerPanel.style.display = 'none';
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">
            <i class="fas fa-shopping-basket"></i>
          </div>
          <h4 class="cart-empty-title">Keranjang Belanja Masih Kosong</h4>
          <p class="cart-empty-desc">
            Kamu belum menambahkan produk apapun. Yuk pilih action figure anime favoritmu sekarang!
          </p>
          <button class="btn-continue-shopping" id="btn-continue-shopping">
            <i class="fas fa-arrow-left"></i> Lanjut Belanja
          </button>
        </div>
      `;

      const btnContinue = document.getElementById('btn-continue-shopping');
      if (btnContinue) {
        btnContinue.addEventListener('click', () => {
          closeCartDrawer();
          // Scroll halus ke daftar produk jika ada di halaman
          const prodSection = document.getElementById('products');
          if (prodSection) {
            prodSection.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = 'menu.html';
          }
        });
      }
      return;
    }

    // Tampilan Saat Ada Item
    if (footerPanel) footerPanel.style.display = 'block';

    container.innerHTML = cart.map(item => {
      const itemSubtotal = item.price * item.qty;
      const isMaxStock = item.qty >= item.stock;

      return `
        <div class="cart-item-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
          <div class="cart-item-info">
            <h5 class="cart-item-name" title="${item.name}">${item.name}</h5>
            <div class="cart-item-price-unit">
              ${CartStore.formatRupiah(item.price)} <small style="color: #2e7d32; font-weight:600;">(Stok: ${item.stock})</small>
            </div>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button class="qty-btn btn-qty-minus" data-id="${item.id}" title="Kurangi">−</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn btn-qty-plus" data-id="${item.id}" ${isMaxStock ? 'disabled title="Mencapai batas stok"' : 'title="Tambah"'}>+</button>
              </div>
              <div class="cart-item-subtotal">
                ${CartStore.formatRupiah(itemSubtotal)}
              </div>
            </div>
          </div>
          <button class="cart-item-remove-btn" data-id="${item.id}" title="Hapus dari keranjang">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
    }).join('');

    // Pasang Event Listeners untuk Tombol di Setiap Item
    container.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cartStore.getItem(id);
        if (item && item.qty > 1) {
          cartStore.updateQuantity(id, item.qty - 1);
        } else if (item && item.qty === 1) {
          // Konfirmasi hapus jika dikurangi di bawah 1
          if (confirm(`Hapus ${item.name} dari keranjang?`)) {
            cartStore.removeItem(id);
            showToast(`${item.name} dihapus dari keranjang.`, 'info');
          }
        }
      });
    });

    container.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cartStore.getItem(id);
        if (item) {
          const res = cartStore.updateQuantity(id, item.qty + 1);
          if (!res.success && res.reason === 'OUT_OF_STOCK') {
            showToast(res.message, 'warning');
          }
        }
      });
    });

    container.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cartStore.getItem(id);
        if (item) {
          cartStore.removeItem(id);
          showToast(`${item.name} telah dihapus dari keranjang.`, 'info');
        }
      });
    });
  }

  /**
   * Menghubungkan Tombol "Tambah ke Keranjang" ke CartStore
   */
  function attachProductButtons() {
    // 1. Tombol pada Kartu Produk (.btn-add-cart)
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const productId = this.getAttribute('data-product-id');
        addToCartById(productId);
      });
    });

    // 2. Tombol pada Tabel Produk (.btn-table-buy)
    document.querySelectorAll('.btn-table-buy').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const productId = this.getAttribute('data-product-id');
        addToCartById(productId);
      });
    });

    // 3. Tombol pada Paket Harga (.btn-pkg-buy)
    document.querySelectorAll('.btn-pkg-buy').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const productId = this.getAttribute('data-product-id');
        addToCartById(productId);
      });
    });
  }

  /**
   * Tambahkan produk ke keranjang berdasarkan ID produk
   * @param {string} productId 
   */
  function addToCartById(productId) {
    if (!productId || !PRODUCTS_DATA[productId]) {
      console.warn('[CartUI] ID Produk tidak ditemukan dalam PRODUCTS_DATA:', productId);
      showToast('Data produk tidak ditemukan.', 'warning');
      return;
    }

    const product = PRODUCTS_DATA[productId];
    if (product.stock === 0) {
      if (window.figureNotify) {
        window.figureNotify.openModal(productId);
      } else {
        showToast('Stok produk ini sedang habis.', 'warning');
      }
      return;
    }

    const res = cartStore.addItem(product, 1);

    if (res.success) {
      showToast(res.message, 'success');
      // Buka drawer sebentar agar user melihat barang masuk secara intuitif
      openCartDrawer();
    } else {
      showToast(res.message, 'warning');
    }
  }

  // Jalankan inisialisasi saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartUI);
  } else {
    initCartUI();
  }

  // Ekspor fungsi pembantu ke window untuk kebutuhan debugging / pemanggilan manual
  window.cartUI = {
    openDrawer: openCartDrawer,
    closeDrawer: closeCartDrawer,
    showToast: showToast,
    addToCartById: addToCartById
  };
})();
