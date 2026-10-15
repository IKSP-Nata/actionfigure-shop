/**
 * Action Figure Store - "Kabari Saya Kalau Ready" (js/notify.js)
 * 
 * Tanggung Jawab Modul:
 * 1. Mendeteksi produk dengan stok 0 dan mengubah tombol beli menjadi "Kabari Saya Kalau Ready".
 * 2. Menyediakan modal interaktif untuk pendaftaran email atau nomor WhatsApp.
 * 3. Melakukan validasi format kontak (email valid ATAU nomor telepon/WA Indonesia minimal 10 digit).
 * 4. Mencegah duplikasi pendaftaran untuk kontak dan produk yang sama via storage.js.
 * 5. Menampilkan konfirmasi keberhasilan pendaftaran.
 * 6. Mendukung penutupan modal dengan tombol X, klik backdrop, dan tombol keyboard Esc.
 */

(function () {
  'use strict';

  const storage = window.figureStorage;
  if (!storage) {
    console.error('[Notify] Storage service belum dimuat. Pastikan storage.js dimuat sebelum notify.js.');
    return;
  }

  let notifyModalEl = null;
  let activeProductId = null;
  let activeProductData = null;

  /**
   * Membuat markup Modal Notifikasi jika belum ada di DOM
   */
  function ensureNotifyModalMarkup() {
    if (document.getElementById('notify-stock-modal-backdrop')) {
      notifyModalEl = document.getElementById('notify-stock-modal-backdrop');
      return;
    }

    notifyModalEl = document.createElement('div');
    notifyModalEl.id = 'notify-stock-modal-backdrop';
    notifyModalEl.className = 'notify-modal-backdrop';
    notifyModalEl.setAttribute('role', 'dialog');
    notifyModalEl.setAttribute('aria-modal', 'true');
    notifyModalEl.innerHTML = `
      <div class="notify-modal-card">
        <div class="notify-modal-header">
          <div class="notify-header-title">
            <i class="fas fa-bell notify-bell-icon"></i>
            <span>Kabari Saya Kalau Ready</span>
          </div>
          <button class="notify-close-btn" id="notify-close-btn" title="Tutup (Esc)">&times;</button>
        </div>

        <div class="notify-modal-body" id="notify-modal-body">
          <div class="notify-product-preview">
            <img id="notify-prod-img" src="" alt="Thumbnail Produk" class="notify-prod-thumb" />
            <div class="notify-prod-info">
              <h4 id="notify-prod-name" class="notify-prod-name">Nama Produk</h4>
              <span class="notify-stock-status-pill">
                <i class="fas fa-times-circle"></i> Stok Habis (Out of Stock)
              </span>
            </div>
          </div>

          <p class="notify-desc-text">
            Figur ini saat ini sedang habis terjual. Masukkan alamat <strong>Email</strong> atau <strong>Nomor WhatsApp</strong> Anda, dan kami akan memprioritaskan Anda saat stok restock kembali!
          </p>

          <form id="notify-request-form" novalidate onsubmit="return false;">
            <div class="notify-form-group">
              <label for="notify-contact-input" class="notify-form-label">Email atau Nomor WhatsApp:</label>
              <div class="notify-input-wrap">
                <i class="fas fa-address-card notify-input-icon"></i>
                <input 
                  type="text" 
                  id="notify-contact-input" 
                  class="notify-form-input" 
                  placeholder="Contoh: kolektor@email.com atau 08123456789" 
                  required 
                  autocomplete="on"
                />
              </div>
              <small class="notify-field-hint">Kami tidak akan mengirimkan spam. Hanya notifikasi ketersediaan figur ini.</small>
            </div>

            <div id="notify-form-alert" class="notify-form-alert" style="display: none;"></div>

            <div class="notify-form-actions">
              <button type="button" class="btn-cancel-notify" id="notify-cancel-btn">Batal</button>
              <button type="submit" class="btn-submit-notify" id="notify-submit-btn">
                <i class="fas fa-bell"></i> Ingatkan Saya
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(notifyModalEl);

    // Event listener tombol tutup
    notifyModalEl.querySelector('#notify-close-btn').addEventListener('click', closeNotifyModal);
    notifyModalEl.querySelector('#notify-cancel-btn').addEventListener('click', closeNotifyModal);

    // Klik backdrop luar untuk menutup modal
    notifyModalEl.addEventListener('click', (e) => {
      if (e.target === notifyModalEl) {
        closeNotifyModal();
      }
    });

    // Keyboard ESC untuk menutup modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && notifyModalEl.classList.contains('active')) {
        closeNotifyModal();
      }
    });

    // Listener submit form
    const form = notifyModalEl.querySelector('#notify-request-form');
    form.addEventListener('submit', handleNotifyFormSubmit);
  }

  /**
   * Validasi format email ATAU nomor telepon/WhatsApp
   * @param {string} input 
   * @returns {{ valid: boolean, type?: 'email'|'whatsapp', message?: string }}
   */
  function validateContact(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) {
      return { valid: false, message: 'Mohon masukkan email atau nomor WhatsApp Anda.' };
    }

    // Cek format email (memiliki @ dan domain valid)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return { valid: true, type: 'email' };
    }

    // Cek format nomor WhatsApp/telepon (angka, min. 10 digit, opsional +, min 10 max 16 karakter)
    const phoneClean = trimmed.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+62|62|08)[0-9]{8,13}$/;
    const generalDigitsOnly = /^[0-9]{10,15}$/;

    if (phoneRegex.test(phoneClean) || generalDigitsOnly.test(phoneClean)) {
      return { valid: true, type: 'whatsapp' };
    }

    return {
      valid: false,
      message: 'Format tidak valid. Masukkan email yang benar (misal: nama@gmail.com) atau nomor HP/WA minimal 10 digit (misal: 08123456789).'
    };
  }

  /**
   * Buka Modal Notifikasi untuk produk tertentu
   * @param {string} productId 
   */
  function openNotifyModal(productId) {
    ensureNotifyModalMarkup();
    activeProductId = productId;
    activeProductData = window.PRODUCTS_DATA ? window.PRODUCTS_DATA[productId] : null;

    const nameEl = notifyModalEl.querySelector('#notify-prod-name');
    const imgEl = notifyModalEl.querySelector('#notify-prod-img');
    const inputEl = notifyModalEl.querySelector('#notify-contact-input');
    const alertEl = notifyModalEl.querySelector('#notify-form-alert');
    const bodyEl = notifyModalEl.querySelector('#notify-modal-body');

    // Reset isi modal jika sebelumnya tampil pesan sukses
    alertEl.style.display = 'none';
    inputEl.value = '';

    if (activeProductData) {
      nameEl.textContent = activeProductData.name;
      imgEl.src = activeProductData.image || 'assets/paket.jpg';
    } else {
      nameEl.textContent = 'Figur Anime';
      imgEl.src = 'assets/paket.jpg';
    }

    notifyModalEl.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => inputEl.focus(), 150);
  }

  /**
   * Tutup Modal Notifikasi
   */
  function closeNotifyModal() {
    if (notifyModalEl) {
      notifyModalEl.classList.remove('active');
      document.body.style.overflow = '';
      activeProductId = null;
    }
  }

  /**
   * Menangani Submit Form Notifikasi
   */
  function handleNotifyFormSubmit(e) {
    e.preventDefault();
    const inputEl = notifyModalEl.querySelector('#notify-contact-input');
    const alertEl = notifyModalEl.querySelector('#notify-form-alert');
    const submitBtn = notifyModalEl.querySelector('#notify-submit-btn');

    alertEl.style.display = 'none';

    const contactVal = inputEl.value.trim();
    const validation = validateContact(contactVal);

    if (!validation.valid) {
      showAlert(validation.message, 'error');
      inputEl.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const res = storage.saveNotifyRequest(activeProductId, {
      contact: contactVal,
      type: validation.type,
      productName: activeProductData ? activeProductData.name : activeProductId,
      productImage: activeProductData ? activeProductData.image : 'assets/paket.jpg'
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-bell"></i> Ingatkan Saya';

    if (res.success) {
      // Tampilkan pesan konfirmasi ramah & sukses
      const bodyEl = notifyModalEl.querySelector('#notify-modal-body');
      bodyEl.innerHTML = `
        <div class="notify-success-box">
          <div class="notify-success-icon"><i class="fas fa-check-circle"></i></div>
          <h4>Permintaan Berhasil Dicatat!</h4>
          <p>
            Terima kasih! Kami telah mencatat kontak <strong>${escapeHtml(contactVal)}</strong> untuk produk <strong>${escapeHtml(activeProductData ? activeProductData.name : 'Figur')}</strong>.
          </p>
          <p class="notify-success-note">
            Segera setelah stok tiba di gudang, kami akan mengirimkan pemberitahuan langsung kepada Anda.
          </p>
          <button class="btn-notify-finish" id="btn-notify-done">
            <i class="fas fa-check"></i> Selesai
          </button>
        </div>
      `;

      bodyEl.querySelector('#btn-notify-done').addEventListener('click', () => {
        closeNotifyModal();
        // Reset modal markup untuk pembukaan berikutnya
        setTimeout(() => {
          if (notifyModalEl && notifyModalEl.parentNode) {
            notifyModalEl.parentNode.removeChild(notifyModalEl);
            notifyModalEl = null;
          }
        }, 300);
      });

      if (window.cartUI && typeof window.cartUI.showToast === 'function') {
        window.cartUI.showToast('Permintaan notifikasi berhasil disimpan!', 'success');
      }
    } else {
      showAlert(res.message || 'Gagal menyimpan permintaan.', res.duplicate ? 'warning' : 'error');
    }
  }

  function showAlert(msg, type) {
    const alertEl = notifyModalEl.querySelector('#notify-form-alert');
    alertEl.className = `notify-form-alert ${type}`;
    alertEl.textContent = msg;
    alertEl.style.display = 'block';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =========================================================================
  // DETEKSI OTOMATIS & PENGGANTIAN TOMBOL UNTUK PRODUK STOK 0
  // =========================================================================

  /**
   * Mengubah tombol beli menjadi "Kabari Saya Kalau Ready" pada kartu produk dengan stok 0
   */
  function transformOutOfStockButtons() {
    if (!window.PRODUCTS_DATA) return;

    document.querySelectorAll('.item').forEach(card => {
      const btn = card.querySelector('[data-product-id]');
      if (!btn) return;

      const productId = btn.getAttribute('data-product-id');
      const prodData = window.PRODUCTS_DATA[productId];
      if (!prodData) return;

      // Jika stok 0
      if (prodData.stock === 0) {
        // 1. Update tag stok menjadi "Stok Habis"
        const stockTag = card.querySelector('.item-stock');
        if (stockTag) {
          stockTag.className = 'item-stock out-of-stock';
          stockTag.innerHTML = '<i class="fas fa-times-circle"></i> Stok Habis';
        }

        // 2. Ubah tombol beli menjadi tombol Kabari
        btn.className = 'btn-notify-stock';
        btn.innerHTML = '<i class="fas fa-bell"></i> Kabari Saya Kalau Ready';
        btn.title = 'Stok saat ini kosong. Klik untuk mendapat notifikasi saat ready.';

        // Lepas listener lama dengan cloneNode
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openNotifyModal(productId);
        });
      }
    });

    // Cek juga pada hero section di index.html
    const heroBtn = document.querySelector('.hero-btn-add[data-product-id]');
    if (heroBtn) {
      const heroId = heroBtn.getAttribute('data-product-id');
      const heroData = window.PRODUCTS_DATA[heroId];
      if (heroData && heroData.stock === 0) {
        heroBtn.className = 'btn-notify-stock hero-btn-add';
        heroBtn.innerHTML = '<i class="fas fa-bell"></i> Kabari Saya Kalau Ready';
        const newHeroBtn = heroBtn.cloneNode(true);
        heroBtn.parentNode.replaceChild(newHeroBtn, heroBtn);
        newHeroBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openNotifyModal(heroId);
        });
      }
    }
  }

  // Inisialisasi saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureNotifyModalMarkup();
      transformOutOfStockButtons();
    });
  } else {
    ensureNotifyModalMarkup();
    transformOutOfStockButtons();
  }

  // Ekspor API notify ke global window
  window.figureNotify = {
    openModal: openNotifyModal,
    closeModal: closeNotifyModal,
    validateContact,
    transformOutOfStockButtons
  };
})();
