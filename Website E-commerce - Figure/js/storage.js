/**
 * Action Figure Store - Storage Service (js/storage.js)
 * 
 * Tanggung Jawab Modul:
 * 1. Pusat kendali seluruh operasi baca & tulis data lokal (localStorage).
 * 2. Mengelola data ulasan & rating produk (getReviews, saveReview, getAverageRating).
 * 3. Mengelola permintaan notifikasi stok kosong (getNotifyRequests, saveNotifyRequest, deleteNotifyRequest).
 * 4. Menangani kesalahan kuota penyimpanan (QuotaExceededError) dengan pesan yang jelas.
 * 5. Mencegah duplikasi permintaan kontak untuk produk yang sama.
 * 6. Menyediakan benih data awal (seeding) agar ulasan tidak kosong saat pertama kali dibuka.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    REVIEWS: 'action_figure_reviews_v1',
    NOTIFY: 'action_figure_notify_requests_v1'
  };

  /**
   * Mengecek apakah localStorage didukung dan dapat diakses
   * @returns {boolean}
   */
  function isLocalStorageAvailable() {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Helper internal untuk membaca data JSON dari localStorage
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {*}
   */
  function readStorage(key, defaultValue) {
    if (!isLocalStorageAvailable()) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (err) {
      console.error(`[Storage] Gagal membaca key "${key}":`, err);
      return defaultValue;
    }
  }

  /**
   * Helper internal untuk menulis data JSON ke localStorage dengan penanganan error kuota penuh
   * @param {string} key 
   * @param {*} value 
   * @returns {{ success: boolean, error?: string, message?: string }}
   */
  function writeStorage(key, value) {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: 'STORAGE_UNAVAILABLE',
        message: 'Penyimpanan lokal tidak didukung atau dinonaktifkan di browser ini.'
      };
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { success: true };
    } catch (err) {
      const isQuotaError = 
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014;

      if (isQuotaError) {
        console.warn('[Storage] Penyimpanan localStorage penuh:', err);
        return {
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: 'Memori penyimpanan browser Anda penuh! Mohon gunakan foto dengan resolusi lebih kecil atau bersihkan data browser.'
        };
      }

      console.error(`[Storage] Gagal menulis ke key "${key}":`, err);
      return {
        success: false,
        error: 'WRITE_ERROR',
        message: 'Terjadi kesalahan saat menyimpan data ke penyimpanan browser.'
      };
    }
  }

  // =========================================================================
  // REVIEW & RATING API
  // =========================================================================

  /**
   * Mengambil semua ulasan produk tertentu
   * @param {string} productId 
   * @returns {Array} List ulasan produk
   */
  function getReviews(productId) {
    if (!productId) return [];
    const allReviews = readStorage(STORAGE_KEYS.REVIEWS, {});
    return Array.isArray(allReviews[productId]) ? allReviews[productId] : [];
  }

  /**
   * Mengambil seluruh ulasan dari semua produk
   * @returns {Object} { [productId]: Array }
   */
  function getAllReviews() {
    return readStorage(STORAGE_KEYS.REVIEWS, {});
  }

  /**
   * Menghitung rata-rata rating, total ulasan, dan rincian bintang (1-5)
   * @param {string} productId 
   * @returns {{ average: number, total: number, breakdown: Object }}
   */
  function getAverageRating(productId) {
    const reviews = getReviews(productId);
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!reviews.length) {
      return { average: 0, total: 0, breakdown };
    }

    let sum = 0;
    reviews.forEach((rev) => {
      const star = Math.max(1, Math.min(5, parseInt(rev.rating, 10) || 5));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += star;
    });

    const average = Math.round((sum / reviews.length) * 10) / 10;
    return { average, total: reviews.length, breakdown };
  }

  /**
   * Menyimpan ulasan baru untuk suatu produk
   * @param {string} productId 
   * @param {Object} reviewData { name, rating, comment, photos: [] }
   * @returns {{ success: boolean, review?: Object, error?: string, message?: string }}
   */
  function saveReview(productId, reviewData) {
    if (!productId) {
      return { success: false, message: 'ID produk tidak valid.' };
    }

    // Validasi data
    const rating = parseInt(reviewData.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { success: false, message: 'Rating harus dipilih antara 1 hingga 5 bintang.' };
    }

    const name = (reviewData.name || '').trim();
    if (!name) {
      return { success: false, message: 'Nama pengulas wajib diisi.' };
    }

    const comment = (reviewData.comment || '').trim();
    if (comment.length < 10) {
      return { success: false, message: 'Komentar ulasan minimal berisi 10 karakter.' };
    }

    const photos = Array.isArray(reviewData.photos) ? reviewData.photos.slice(0, 3) : [];

    const newReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      productId: productId,
      name: name,
      rating: rating,
      comment: comment,
      photos: photos, // Array string base64
      date: new Date().toISOString()
    };

    const allReviews = readStorage(STORAGE_KEYS.REVIEWS, {});
    if (!Array.isArray(allReviews[productId])) {
      allReviews[productId] = [];
    }

    // Tambahkan ulasan terbaru di paling awal
    allReviews[productId].unshift(newReview);

    const writeRes = writeStorage(STORAGE_KEYS.REVIEWS, allReviews);
    if (!writeRes.success) {
      return writeRes;
    }

    // Picu event kustom agar komponen UI yang subscribe bisa terupdate
    window.dispatchEvent(new CustomEvent('figure_reviews_updated', {
      detail: { productId, review: newReview }
    }));

    return {
      success: true,
      review: newReview,
      message: 'Ulasan Anda berhasil dikirim! Terima kasih atas ulasannya.'
    };
  }

  // =========================================================================
  // NOTIFY ME (KABARI SAYA KALAU READY) API
  // =========================================================================

  /**
   * Mengambil semua permintaan notifikasi stok
   * @returns {Array} List permintaan
   */
  function getNotifyRequests() {
    return readStorage(STORAGE_KEYS.NOTIFY, []);
  }

  /**
   * Menyimpan permintaan notifikasi stok baru
   * Mencegah duplikasi untuk kontak dan produk yang sama
   * 
   * @param {string} productId 
   * @param {Object} data { contact, type, productName, productImage }
   * @returns {{ success: boolean, duplicate?: boolean, request?: Object, message?: string }}
   */
  function saveNotifyRequest(productId, data) {
    if (!productId) {
      return { success: false, message: 'ID produk tidak valid.' };
    }

    const contactRaw = (data.contact || '').trim();
    if (!contactRaw) {
      return { success: false, message: 'Kontak (Email atau WhatsApp) wajib diisi.' };
    }

    const contactNormalized = contactRaw.toLowerCase();
    const requests = getNotifyRequests();

    // Validasi duplikasi
    const isDuplicate = requests.some((req) => {
      return req.productId === productId && req.contact.toLowerCase() === contactNormalized;
    });

    if (isDuplicate) {
      return {
        success: false,
        duplicate: true,
        message: 'Kontak Anda sudah terdaftar untuk menerima kabar saat produk ini ready kembali.'
      };
    }

    const newRequest = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      productId: productId,
      productName: data.productName || productId,
      productImage: data.productImage || 'assets/paket.jpg',
      contact: contactRaw,
      type: data.type || (contactRaw.includes('@') ? 'email' : 'whatsapp'),
      timestamp: new Date().toISOString(),
      status: 'pending' // pending | contacted
    };

    requests.unshift(newRequest);

    const writeRes = writeStorage(STORAGE_KEYS.NOTIFY, requests);
    if (!writeRes.success) {
      return writeRes;
    }

    window.dispatchEvent(new CustomEvent('figure_notify_updated', {
      detail: { request: newRequest }
    }));

    return {
      success: true,
      request: newRequest,
      message: 'Permintaan berhasil disimpan! Kami akan segera mengabari Anda saat stok kembali tersedia.'
    };
  }

  /**
   * Menghapus permintaan notifikasi (oleh Admin)
   * @param {string} requestId 
   * @returns {{ success: boolean, message?: string }}
   */
  function deleteNotifyRequest(requestId) {
    const requests = getNotifyRequests();
    const updated = requests.filter(r => r.id !== requestId);

    if (updated.length !== requests.length) {
      const res = writeStorage(STORAGE_KEYS.NOTIFY, updated);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('figure_notify_updated', { detail: { action: 'delete', requestId } }));
        return { success: true, message: 'Data permintaan berhasil dihapus.' };
      }
      return res;
    }
    return { success: false, message: 'Data permintaan tidak ditemukan.' };
  }

  /**
   * Memperbarui status notifikasi (misal: 'contacted' atau 'pending')
   * @param {string} requestId 
   * @param {'pending'|'contacted'} status 
   */
  function updateNotifyStatus(requestId, status) {
    const requests = getNotifyRequests();
    const target = requests.find(r => r.id === requestId);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    target.status = status;
    const res = writeStorage(STORAGE_KEYS.NOTIFY, requests);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('figure_notify_updated', { detail: { action: 'update', requestId, status } }));
      return { success: true, message: 'Status berhasil diperbarui.' };
    }
    return res;
  }

  // =========================================================================
  // DATA SEEDING (ULASAN AWAL REALISTIS)
  // =========================================================================

  /**
   * Mengisi data awal ulasan agar toko langsung terlihat hidup & menarik
   */
  function seedInitialReviews() {
    const existing = readStorage(STORAGE_KEYS.REVIEWS, null);
    if (existing && Object.keys(existing).length > 0) {
      return; // Sudah ada data, jangan overwrite
    }

    const initialData = {
      'choso': [
        {
          id: 'rev_seed_1',
          productId: 'choso',
          name: 'Budi Santoso',
          rating: 5,
          comment: 'Figure Choso detailnya luar biasa! Cat bajunya rapi dan ekspresi wajahnya sangat akurat seperti di anime JJK Shibuya Incident. Pengiriman juga cepat dan bubble wrap sangat tebal.',
          photos: ['assets/chos.jpg'],
          date: '2026-09-12T10:15:00.000Z'
        },
        {
          id: 'rev_seed_2',
          productId: 'choso',
          name: 'Reza Pratama',
          rating: 5,
          comment: 'Mantap banget! Figure berdiri kokoh di base-nya, artikulasi darah Blood Manipulation terlihat sangat keren saat dipajang di lemari kaca.',
          photos: [],
          date: '2026-09-20T14:30:00.000Z'
        },
        {
          id: 'rev_seed_3',
          productId: 'choso',
          name: 'Dani Finch',
          rating: 4,
          comment: 'Kualitas mantap harga bersahabat. Pengiriman tepat waktu dan barang original tanpa cacat.',
          photos: [],
          date: '2026-10-02T08:00:00.000Z'
        }
      ],
      'sukuna': [
        {
          id: 'rev_seed_4',
          productId: 'sukuna',
          name: 'Aris K.',
          rating: 5,
          comment: 'Ryomen Sukuna aura raja kutukan sangat berasa! Tato di tubuh dan wajahnya sangat presisi. Sangat puas belanja di sini!',
          photos: ['assets/sukuna.jpeg'],
          date: '2026-09-15T11:20:00.000Z'
        },
        {
          id: 'rev_seed_5',
          productId: 'sukuna',
          name: 'Faisal Akbar',
          rating: 5,
          comment: 'Keren abis koleksi sukuna ini! Sayang sekarang stoknya lagi habis, untung kebagian kemarin.',
          photos: [],
          date: '2026-09-28T16:45:00.000Z'
        }
      ],
      'gojoo': [
        {
          id: 'rev_seed_6',
          productId: 'gojoo',
          name: 'Sarah Amanda',
          rating: 5,
          comment: 'Gojo Satoru paling ganteng! Pose jurus Hollow Purple sangat epik. Worth it banget buat kolektor JJK.',
          photos: ['assets/gojo.jpg'],
          date: '2026-09-10T09:00:00.000Z'
        }
      ],
      'geto-hero': [
        {
          id: 'rev_seed_7',
          productId: 'geto-hero',
          name: 'Chesta',
          rating: 5,
          comment: 'Beli figure Geto agar menjadi nyata! Ukuran big size ini benar-benar megah dan jubah biksu budhanya sangat detail.',
          photos: ['assets/geto.jpeg'],
          date: '2026-08-30T12:00:00.000Z'
        }
      ]
    };

    writeStorage(STORAGE_KEYS.REVIEWS, initialData);
  }

  // Jalankan seeding otomatis saat script dimuat
  seedInitialReviews();

  // Ekspor API storage ke global window object
  window.figureStorage = {
    isAvailable: isLocalStorageAvailable,
    getReviews,
    getAllReviews,
    getAverageRating,
    saveReview,
    getNotifyRequests,
    saveNotifyRequest,
    deleteNotifyRequest,
    updateNotifyStatus
  };

  console.log('[figureStorage] Storage service siap digunakan.');
})();
