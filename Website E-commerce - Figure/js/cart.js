/**
 * Action Figure Store - Cart State Management (State & Business Logic)
 * 
 * Tanggung Jawab Modul:
 * 1. Menyimpan dan memuat data keranjang belanja dari localStorage (persistensi).
 * 2. Menambah produk ke keranjang (jika produk sudah ada, menambah jumlah (qty) bukan membuat baris baru).
 * 3. Membatasi penambahan jumlah agar tidak melebihi stok yang tersedia.
 * 4. Mengubah jumlah (+ / -) dengan batas minimal 1 item dan batas maksimal stok.
 * 5. Menghapus produk per item atau mengosongkan seluruh keranjang.
 * 6. Menghitung subtotal per item dan total harga keseluruhan dalam Rupiah.
 * 7. Menyediakan event subscriber (Observer pattern) agar UI dapat merespon perubahan data seketika.
 */

const STORAGE_KEY = 'action_figure_cart_v1';

class CartStore {
  constructor() {
    this.cart = this.loadFromStorage();
    this.listeners = [];
  }

  /**
   * Mengambil data keranjang dari browser localStorage
   * @returns {Array} List item keranjang
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[CartStore] Gagal membaca data dari localStorage:', error);
      return [];
    }
  }

  /**
   * Menyimpan perubahan data keranjang ke localStorage dan memicu subscriber
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));
    } catch (error) {
      console.error('[CartStore] Gagal menyimpan data ke localStorage:', error);
    }
    this.notify();
  }

  /**
   * Mendaftarkan callback listener saat state keranjang berubah
   * @param {Function} callback 
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Mengirim notifikasi perubahan ke seluruh subscriber terdaftar
   */
  notify() {
    const currentCart = this.getCart();
    this.listeners.forEach((callback) => {
      try {
        callback(currentCart);
      } catch (err) {
        console.error('[CartStore] Kesalahan pada listener callback:', err);
      }
    });
  }

  /**
   * Mengembalikan salinan data keranjang saat ini
   * @returns {Array}
   */
  getCart() {
    return this.cart.map(item => ({ ...item }));
  }

  /**
   * Format angka integer menjadi format mata uang Rupiah (contoh: Rp 250.000)
   * @param {number} amount 
   * @returns {string}
   */
  static formatRupiah(amount) {
    const num = Number(amount) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  /**
   * Mencari produk berdasarkan ID di dalam keranjang
   * @param {string} productId 
   * @returns {Object|null}
   */
  getItem(productId) {
    return this.cart.find(item => item.id === productId) || null;
  }

  /**
   * Menambahkan produk ke dalam keranjang
   * Aturan:
   * - Jika produk sudah ada, QTY bertambah (bukan membuat baris baru).
   * - Jumlah tidak boleh melampaui stok produk.
   * 
   * @param {Object} product - Objek produk { id, name, price, stock, image }
   * @param {number} qtyToAdd - Jumlah yang ingin ditambahkan (default: 1)
   * @returns {Object} { success: boolean, item, reason, message }
   */
  addItem(product, qtyToAdd = 1) {
    if (!product || !product.id) {
      return { success: false, message: 'Data produk tidak valid.' };
    }

    const qty = Math.max(1, parseInt(qtyToAdd, 10) || 1);
    const stock = typeof product.stock === 'number' ? product.stock : 999;
    const existingIndex = this.cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      // Produk sudah ada di keranjang -> perbarui jumlahnya
      const currentItem = this.cart[existingIndex];
      const targetQty = currentItem.qty + qty;

      if (targetQty > stock) {
        return {
          success: false,
          reason: 'OUT_OF_STOCK',
          message: `Stok tidak cukup! Maksimal hanya ${stock} item (sudah ada ${currentItem.qty} di keranjang).`,
          currentQty: currentItem.qty,
          stock: stock
        };
      }

      currentItem.qty = targetQty;
      // Perbarui referensi data terbaru jika ada
      currentItem.price = Number(product.price) || currentItem.price;
      currentItem.stock = stock;
      if (product.image) currentItem.image = product.image;

      this.saveToStorage();

      return {
        success: true,
        isNew: false,
        item: { ...currentItem },
        message: `${currentItem.name} (${currentItem.qty}x) berhasil diperbarui di keranjang.`
      };
    } else {
      // Produk baru ditambahkan ke keranjang
      if (qty > stock) {
        return {
          success: false,
          reason: 'OUT_OF_STOCK',
          message: `Stok tidak cukup! Hanya tersedia ${stock} item.`,
          currentQty: 0,
          stock: stock
        };
      }

      const newItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || 'assets/paket.jpg',
        stock: stock,
        qty: qty
      };

      this.cart.push(newItem);
      this.saveToStorage();

      return {
        success: true,
        isNew: true,
        item: { ...newItem },
        message: `${newItem.name} berhasil ditambahkan ke keranjang!`
      };
    }
  }

  /**
   * Mengubah kuantitas item (+ atau -)
   * @param {string} productId 
   * @param {number} newQty 
   * @returns {Object}
   */
  updateQuantity(productId, newQty) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) {
      return { success: false, message: 'Produk tidak ditemukan di keranjang.' };
    }

    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) {
      return { success: false, message: 'Jumlah minimal pembelian adalah 1.' };
    }

    if (qty > item.stock) {
      return {
        success: false,
        reason: 'OUT_OF_STOCK',
        message: `Stok maksimal untuk ${item.name} adalah ${item.stock}.`,
        currentQty: item.qty,
        stock: item.stock
      };
    }

    item.qty = qty;
    this.saveToStorage();

    return {
      success: true,
      item: { ...item },
      message: `Jumlah ${item.name} diubah menjadi ${qty}.`
    };
  }

  /**
   * Menghapus 1 produk dari keranjang
   * @param {string} productId 
   * @returns {Object}
   */
  removeItem(productId) {
    const itemIndex = this.cart.findIndex(i => i.id === productId);
    if (itemIndex > -1) {
      const removed = this.cart.splice(itemIndex, 1)[0];
      this.saveToStorage();
      return {
        success: true,
        item: removed,
        message: `${removed.name} telah dihapus dari keranjang.`
      };
    }
    return { success: false, message: 'Item tidak ditemukan.' };
  }

  /**
   * Mengosongkan seluruh isi keranjang
   */
  clearCart() {
    this.cart = [];
    this.saveToStorage();
    return {
      success: true,
      message: 'Keranjang belanja telah dikosongkan.'
    };
  }

  /**
   * Menghitung total jumlah seluruh barang (total QTY)
   * @returns {number}
   */
  getTotalCount() {
    return this.cart.reduce((total, item) => total + (item.qty || 0), 0);
  }

  /**
   * Menghitung subtotal untuk satu item produk (harga x qty)
   * @param {string} productId 
   * @returns {number}
   */
  getItemSubtotal(productId) {
    const item = this.getItem(productId);
    return item ? (item.price * item.qty) : 0;
  }

  /**
   * Menghitung total keseluruhan nilai belanjaan di keranjang
   * @returns {number}
   */
  getTotalPrice() {
    return this.cart.reduce((total, item) => total + (item.price * (item.qty || 0)), 0);
  }
}

// Inisialisasi CartStore secara global
window.cartStore = new CartStore();
