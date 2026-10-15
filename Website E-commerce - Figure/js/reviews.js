/**
 * Action Figure Store - Reviews & Ratings Controller (js/reviews.js)
 * 
 * Tanggung Jawab Modul:
 * 1. Menangani kompresi foto di browser menggunakan Canvas (lebar maks. 800px, base64).
 * 2. Mengelola form ulasan: validasi rating 1-5, nama, komentar (min. 10 karakter), maksimal 3 foto.
 * 3. Mencegah serangan XSS dengan tidak memasukkan input pengguna lewat innerHTML.
 * 4. Menyortir ulasan: 'terbaru', 'tertinggi', 'foto'.
 * 5. Menampilkan galeri "Foto dari Pembeli" lengkap dengan Lightbox pembesar foto.
 * 6. Merender ringkasan bintang dan jumlah ulasan di kartu produk & halaman detail.
 * 7. Mendukung penutupan Lightbox via tombol X, klik backdrop, dan tombol keyboard Esc.
 */

(function () {
  'use strict';

  // Pastikan storage service sudah tersedia
  const storage = window.figureStorage;
  if (!storage) {
    console.error('[Reviews] Storage service belum dimuat. Pastikan storage.js dimuat sebelum reviews.js.');
    return;
  }

  /**
   * Mengompres dan me-resize gambar lewat Canvas browser
   * Maksimal lebar 800px, format JPEG kualitas 0.82
   * 
   * @param {File} file 
   * @param {number} maxWidth 
   * @returns {Promise<string>} Base64 Data URL
   */
  function compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('File yang diunggah bukan format gambar yang valid.'));
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;

          // Resize jika lebar melebihi batas maksimum
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Konversi ke base64 JPEG dengan kompresi optimal
          const base64Data = canvas.toDataURL('image/jpeg', 0.82);
          resolve(base64Data);
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompres.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper untuk membuat elemen bintang rating (FontAwesome)
   * @param {number} rating (1-5)
   * @returns {HTMLElement}
   */
  function renderStarRatingElement(rating) {
    const container = document.createElement('span');
    container.className = 'star-rating-display';
    const num = Math.round(rating);

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      if (i <= num) {
        star.className = 'fas fa-star star-filled';
      } else {
        star.className = 'far fa-star star-empty';
      }
      container.appendChild(star);
    }
    return container;
  }

  /**
   * Format tanggal ISO ke format bahasa Indonesia ramah (contoh: "14 Oktober 2026")
   * @param {string} dateString 
   * @returns {string}
   */
  function formatDateIndo(dateString) {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Baru saja';
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Baru saja';
    }
  }

  /**
   * Lightbox Pembesar Foto Pembeli
   */
  let lightboxEl = null;

  function initLightbox() {
    if (document.getElementById('buyer-photo-lightbox')) return;

    lightboxEl = document.createElement('div');
    lightboxEl.id = 'buyer-photo-lightbox';
    lightboxEl.className = 'lightbox-backdrop';
    lightboxEl.setAttribute('role', 'dialog');
    lightboxEl.setAttribute('aria-modal', 'true');

    // Markup aman untuk lightbox
    lightboxEl.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close-btn" id="lightbox-close-btn" title="Tutup (Esc)">&times;</button>
        <div class="lightbox-image-wrap">
          <img id="lightbox-img" src="" alt="Foto dari Pembeli" />
        </div>
        <div class="lightbox-caption">
          <div class="lightbox-reviewer-name" id="lightbox-name"></div>
          <div class="lightbox-reviewer-date" id="lightbox-date"></div>
        </div>
      </div>
    `;

    document.body.appendChild(lightboxEl);

    // Event listener penutup Lightbox (Tombol X & Klik Luar)
    lightboxEl.querySelector('#lightbox-close-btn').addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) closeLightbox();
    });

    // Event listener penutup Lightbox via tombol Keyboard ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxEl.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  function openLightbox(photoSrc, reviewerName, reviewDate) {
    initLightbox();
    const img = document.getElementById('lightbox-img');
    const nameEl = document.getElementById('lightbox-name');
    const dateEl = document.getElementById('lightbox-date');

    img.src = photoSrc;
    nameEl.textContent = reviewerName ? `Foto oleh: ${reviewerName}` : 'Foto Pembeli';
    dateEl.textContent = reviewDate ? formatDateIndo(reviewDate) : '';

    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lightboxEl) {
      lightboxEl.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // =========================================================================
  // KONTROL ULASAN PADA HALAMAN DETAIL PRODUK
  // =========================================================================

  /**
   * Menyiapkan seluruh komponen ulasan di elemen container halaman detail produk
   * @param {HTMLElement} container 
   * @param {string} productId 
   */
  function setupProductReviewsSection(container, productId) {
    if (!container || !productId) return;

    let selectedRating = 5;
    let uploadedPhotos = []; // Menyimpan base64 hasil kompresi (maks. 3)
    let currentSort = 'terbaru'; // terbaru | tertinggi | foto

    container.innerHTML = `
      <section class="reviews-section-wrapper">
        <div class="reviews-header-block">
          <h2 class="reviews-section-title">
            <i class="fas fa-star" style="color: #ffb800;"></i> Ulasan & Penilaian Pelanggan
          </h2>
          <p class="reviews-section-subtitle">Semua ulasan dari pembeli action figure terverifikasi</p>
        </div>

        <!-- 1. Ringkasan Rating -->
        <div class="rating-overview-card" id="rating-overview-card">
          <!-- Diisi secara dinamis -->
        </div>

        <!-- 2. Galeri Foto Pembeli -->
        <div class="buyer-photos-gallery-block" id="buyer-photos-gallery-block" style="display: none;">
          <h4 class="buyer-photos-title">
            <i class="fas fa-camera"></i> Foto dari Pembeli
            <small class="buyer-photos-count" id="buyer-photos-count">(0 foto)</small>
          </h4>
          <div class="buyer-photos-strip" id="buyer-photos-strip"></div>
        </div>

        <!-- 3. Form Tulis Ulasan -->
        <div class="review-form-card">
          <h3 class="review-form-title">
            <i class="fas fa-pen-nib"></i> Tulis Ulasan Produk
          </h3>
          <p class="review-form-info">Bagikan pengalaman Anda mengenai kualitas detail, cat, dan pengemasan figur ini.</p>
          
          <form id="product-review-form" novalidate>
            <!-- Rating Bintang Interaktif -->
            <div class="form-group-rating">
              <label class="form-label">Beri Penilaian Bintang: <span class="required">*</span></label>
              <div class="interactive-star-picker" id="star-picker" role="radiogroup" aria-label="Rating Bintang">
                <i class="fas fa-star star-pick active" data-val="1" title="1 Bintang - Sangat Buruk"></i>
                <i class="fas fa-star star-pick active" data-val="2" title="2 Bintang - Buruk"></i>
                <i class="fas fa-star star-pick active" data-val="3" title="3 Bintang - Cukup"></i>
                <i class="fas fa-star star-pick active" data-val="4" title="4 Bintang - Bagus"></i>
                <i class="fas fa-star star-pick active" data-val="5" title="5 Bintang - Sangat Puas!"></i>
                <span class="rating-feedback-label" id="rating-label">5.0 (Sangat Puas!)</span>
              </div>
            </div>

            <!-- Nama Pengulas -->
            <div class="form-group">
              <label for="review-author-name" class="form-label">Nama Anda: <span class="required">*</span></label>
              <input type="text" id="review-author-name" class="form-input" placeholder="Masukkan nama atau inisial Anda..." required maxlength="60" />
            </div>

            <!-- Komentar Ulasan -->
            <div class="form-group">
              <div class="label-with-counter">
                <label for="review-comment-text" class="form-label">Ulasan Lengkap: <span class="required">*</span></label>
                <span class="char-counter" id="char-counter">0 / min. 10 karakter</span>
              </div>
              <textarea id="review-comment-text" class="form-textarea" rows="3" placeholder="Ceritakan detail figur, ketahanan, kepuasan terhadap produk (minimal 10 karakter)..." required minlength="10" maxlength="800"></textarea>
            </div>

            <!-- Unggah Foto (Maks 3 Foto) -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-image"></i> Tambahkan Foto Figur (Maks. 3 Foto):
              </label>
              <div class="photo-upload-zone">
                <label for="review-photos-input" class="photo-upload-trigger">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Pilih Foto dari Galeri / Kamera</span>
                  <input type="file" id="review-photos-input" accept="image/*" multiple style="display: none;" />
                </label>
                <div class="photo-preview-grid" id="photo-preview-grid"></div>
              </div>
              <small class="photo-upload-hint">Foto otomatis dikompres ke lebar 800px untuk menghemat ruang.</small>
            </div>

            <!-- Pesan Kesalahan / Sukses Form -->
            <div id="review-form-alert" class="review-form-alert" style="display: none;"></div>

            <!-- Tombol Kirim -->
            <button type="submit" class="btn-submit-review" id="btn-submit-review">
              <i class="fas fa-paper-plane"></i> Kirim Ulasan
            </button>
          </form>
        </div>

        <!-- 4. Filter & Daftar Ulasan -->
        <div class="reviews-list-container">
          <div class="reviews-list-toolbar">
            <h3 class="reviews-list-heading">
              Daftar Ulasan <span class="reviews-count-badge" id="reviews-count-badge">(0)</span>
            </h3>
            <div class="sort-selector-wrapper">
              <label for="reviews-sort-select"><i class="fas fa-sort-amount-down"></i> Urutkan:</label>
              <select id="reviews-sort-select" class="sort-select">
                <option value="terbaru">Ulasan Terbaru</option>
                <option value="tertinggi">Rating Tertinggi</option>
                <option value="foto">Memiliki Foto</option>
              </select>
            </div>
          </div>

          <div class="reviews-items-feed" id="reviews-items-feed">
            <!-- Item ulasan dirender dengan aman via DOM -->
          </div>
        </div>
      </section>
    `;

    // Pasang interactive star picker
    const starPicker = container.querySelector('#star-picker');
    const ratingLabel = container.querySelector('#rating-label');
    const starIcons = starPicker.querySelectorAll('.star-pick');

    const ratingDescriptions = {
      1: '1.0 (Sangat Buruk)',
      2: '2.0 (Kurang Memuaskan)',
      3: '3.0 (Cukup Bagus)',
      4: '4.0 (Bagus / Puas)',
      5: '5.0 (Sangat Puas!)'
    };

    function updateStars(val) {
      selectedRating = val;
      starIcons.forEach(star => {
        const starVal = parseInt(star.getAttribute('data-val'), 10);
        if (starVal <= val) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });
      ratingLabel.textContent = ratingDescriptions[val] || `${val}.0`;
    }

    starIcons.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-val'), 10);
        updateStars(val);
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.getAttribute('data-val'), 10);
        starIcons.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-val'), 10);
          if (sVal <= val) s.classList.add('hover');
          else s.classList.remove('hover');
        });
      });
    });

    starPicker.addEventListener('mouseleave', () => {
      starIcons.forEach(s => s.classList.remove('hover'));
    });

    // Character counter untuk komentar
    const commentInput = container.querySelector('#review-comment-text');
    const charCounter = container.querySelector('#char-counter');
    commentInput.addEventListener('input', () => {
      const len = commentInput.value.trim().length;
      charCounter.textContent = `${len} / min. 10 karakter`;
      if (len >= 10) {
        charCounter.classList.add('valid');
        charCounter.classList.remove('invalid');
      } else {
        charCounter.classList.add('invalid');
        charCounter.classList.remove('valid');
      }
    });

    // Upload & Kompresi Foto
    const photosInput = container.querySelector('#review-photos-input');
    const previewGrid = container.querySelector('#photo-preview-grid');

    photosInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const availableSlots = 3 - uploadedPhotos.length;
      if (availableSlots <= 0) {
        alert('Maksimal hanya dapat melampirkan 3 foto per ulasan.');
        photosInput.value = '';
        return;
      }

      const filesToProcess = files.slice(0, availableSlots);

      for (const file of filesToProcess) {
        try {
          const compressedBase64 = await compressImage(file, 800);
          uploadedPhotos.push(compressedBase64);
        } catch (err) {
          console.warn('[Reviews] Gagal memproses gambar:', err);
          alert(err.message || 'Gagal memproses salah satu gambar.');
        }
      }

      photosInput.value = '';
      renderPhotoPreviews();
    });

    function renderPhotoPreviews() {
      previewGrid.innerHTML = '';
      uploadedPhotos.forEach((src, idx) => {
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'photo-preview-item';

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Preview Foto ${idx + 1}`;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'photo-preview-del-btn';
        delBtn.title = 'Hapus foto';
        delBtn.innerHTML = '&times;';
        delBtn.addEventListener('click', () => {
          uploadedPhotos.splice(idx, 1);
          renderPhotoPreviews();
        });

        thumbWrap.appendChild(img);
        thumbWrap.appendChild(delBtn);
        previewGrid.appendChild(thumbWrap);
      });
    }

    // Submit Review Form
    const reviewForm = container.querySelector('#product-review-form');
    const formAlert = container.querySelector('#review-form-alert');
    const btnSubmit = container.querySelector('#btn-submit-review');

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formAlert.style.display = 'none';

      const authorName = container.querySelector('#review-author-name').value.trim();
      const commentText = commentInput.value.trim();

      // Validasi
      if (!authorName) {
        showFormAlert('Mohon masukkan nama Anda.', 'error');
        return;
      }

      if (commentText.length < 10) {
        showFormAlert('Ulasan Anda terlalu singkat. Minimal 10 karakter.', 'error');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

      const saveRes = storage.saveReview(productId, {
        name: authorName,
        rating: selectedRating,
        comment: commentText,
        photos: [...uploadedPhotos]
      });

      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Ulasan';

      if (saveRes.success) {
        showFormAlert(saveRes.message, 'success');
        // Reset form
        reviewForm.reset();
        uploadedPhotos = [];
        renderPhotoPreviews();
        updateStars(5);
        charCounter.textContent = '0 / min. 10 karakter';
        charCounter.classList.remove('valid', 'invalid');

        // Render ulang ulasan
        renderAllReviewElements();
      } else {
        showFormAlert(saveRes.message || 'Gagal menyimpan ulasan.', 'error');
      }
    });

    function showFormAlert(msg, type) {
      formAlert.className = `review-form-alert ${type}`;
      formAlert.textContent = msg;
      formAlert.style.display = 'block';
    }

    // Sort listener
    const sortSelect = container.querySelector('#reviews-sort-select');
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderReviewsList();
    });

    /**
     * Render Seluruh Komponen Ulasan
     */
    function renderAllReviewElements() {
      renderRatingOverview();
      renderBuyerPhotosGallery();
      renderReviewsList();
    }

    /**
     * Render Ringkasan Rating (Average & Breakdown Bar)
     */
    function renderRatingOverview() {
      const overviewContainer = container.querySelector('#rating-overview-card');
      const stats = storage.getAverageRating(productId);

      overviewContainer.innerHTML = '';

      const leftCol = document.createElement('div');
      leftCol.className = 'rating-overview-left';

      const bigScore = document.createElement('div');
      bigScore.className = 'rating-big-score';
      bigScore.textContent = stats.total > 0 ? stats.average.toFixed(1) : '0.0';

      const starsDisplay = renderStarRatingElement(stats.average);

      const totalCountLabel = document.createElement('div');
      totalCountLabel.className = 'rating-total-label';
      totalCountLabel.textContent = stats.total > 0 
        ? `Berdasarkan ${stats.total} ulasan pembeli` 
        : 'Belum ada ulasan';

      leftCol.appendChild(bigScore);
      leftCol.appendChild(starsDisplay);
      leftCol.appendChild(totalCountLabel);

      // Kolom kanan: Breakdown bar 5 ke 1 bintang
      const rightCol = document.createElement('div');
      rightCol.className = 'rating-overview-right';

      for (let star = 5; star >= 1; star--) {
        const count = stats.breakdown[star] || 0;
        const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

        const barRow = document.createElement('div');
        barRow.className = 'rating-bar-row';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'rating-bar-star-label';
        labelSpan.textContent = `${star} Bintang`;

        const trackDiv = document.createElement('div');
        trackDiv.className = 'rating-bar-track';

        const fillDiv = document.createElement('div');
        fillDiv.className = 'rating-bar-fill';
        fillDiv.style.width = `${percentage}%`;
        trackDiv.appendChild(fillDiv);

        const countSpan = document.createElement('span');
        countSpan.className = 'rating-bar-count-label';
        countSpan.textContent = `${count} (${percentage}%)`;

        barRow.appendChild(labelSpan);
        barRow.appendChild(trackDiv);
        barRow.appendChild(countSpan);

        rightCol.appendChild(barRow);
      }

      overviewContainer.appendChild(leftCol);
      overviewContainer.appendChild(rightCol);
    }

    /**
     * Render Galeri Foto Pembeli (Foto Strip Horizontal)
     */
    function renderBuyerPhotosGallery() {
      const galleryBlock = container.querySelector('#buyer-photos-gallery-block');
      const galleryStrip = container.querySelector('#buyer-photos-strip');
      const countLabel = container.querySelector('#buyer-photos-count');

      const reviews = storage.getReviews(productId);
      const allPhotos = [];

      reviews.forEach(rev => {
        if (Array.isArray(rev.photos)) {
          rev.photos.forEach(photoSrc => {
            allPhotos.push({
              src: photoSrc,
              author: rev.name,
              date: rev.date
            });
          });
        }
      });

      if (!allPhotos.length) {
        galleryBlock.style.display = 'none';
        return;
      }

      galleryBlock.style.display = 'block';
      countLabel.textContent = `(${allPhotos.length} foto)`;
      galleryStrip.innerHTML = '';

      allPhotos.forEach(item => {
        const photoCard = document.createElement('div');
        photoCard.className = 'buyer-photo-thumb-card';
        photoCard.title = `Klik untuk memperbesar foto oleh ${item.author}`;

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Foto figur oleh ${item.author}`;
        img.loading = 'lazy';

        photoCard.appendChild(img);
        photoCard.addEventListener('click', () => {
          openLightbox(item.src, item.author, item.date);
        });

        galleryStrip.appendChild(photoCard);
      });
    }

    /**
     * Render Daftar Ulasan dengan Sorting & PENCEGAHAN XSS TOTAL
     */
    function renderReviewsList() {
      const feed = container.querySelector('#reviews-items-feed');
      const countBadge = container.querySelector('#reviews-count-badge');
      let reviews = storage.getReviews(productId);

      countBadge.textContent = `(${reviews.length})`;
      feed.innerHTML = '';

      if (!reviews.length) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'reviews-empty-state';
        emptyBox.innerHTML = `
          <div class="empty-icon"><i class="far fa-comment-dots"></i></div>
          <h4>Belum Ada Ulasan untuk Figur Ini</h4>
          <p>Jadilah kolektor pertama yang memberikan penilaian dan foto figur ini!</p>
        `;
        feed.appendChild(emptyBox);
        return;
      }

      // Terapkan sorting
      if (currentSort === 'tertinggi') {
        reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (currentSort === 'foto') {
        reviews.sort((a, b) => {
          const hasPhotoA = Array.isArray(a.photos) && a.photos.length > 0 ? 1 : 0;
          const hasPhotoB = Array.isArray(b.photos) && b.photos.length > 0 ? 1 : 0;
          return hasPhotoB - hasPhotoA;
        });
      } else {
        // default: terbaru
        reviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      }

      // Render setiap item ulasan secara aman menggunakan TextContent (Cegah XSS)
      reviews.forEach(rev => {
        const card = document.createElement('div');
        card.className = 'review-item-card';

        // 1. Header ulasan (Nama, Avatar Inisial, Badge Verifikasi, Tanggal)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'review-item-header';

        const userMeta = document.createElement('div');
        userMeta.className = 'review-user-meta';

        const avatar = document.createElement('div');
        avatar.className = 'review-user-avatar';
        avatar.textContent = (rev.name || 'A').charAt(0).toUpperCase();

        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'review-name-wrap';

        const nameEl = document.createElement('h5');
        nameEl.className = 'review-author-name';
        nameEl.textContent = rev.name || 'Pembeli Anonim'; // AMAN DARI XSS

        const verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'verified-buyer-badge';
        verifiedBadge.innerHTML = '<i class="fas fa-check-circle"></i> Pembeli Terverifikasi';

        nameWrapper.appendChild(nameEl);
        nameWrapper.appendChild(verifiedBadge);

        userMeta.appendChild(avatar);
        userMeta.appendChild(nameWrapper);

        const dateEl = document.createElement('span');
        dateEl.className = 'review-date-label';
        dateEl.textContent = formatDateIndo(rev.date);

        headerDiv.appendChild(userMeta);
        headerDiv.appendChild(dateEl);
        card.appendChild(headerDiv);

        // 2. Bintang penilaian
        const starsWrap = document.createElement('div');
        starsWrap.className = 'review-item-stars';
        starsWrap.appendChild(renderStarRatingElement(rev.rating));

        const ratingNum = document.createElement('span');
        ratingNum.className = 'review-rating-num';
        ratingNum.textContent = `${rev.rating}.0 / 5.0`;
        starsWrap.appendChild(ratingNum);

        card.appendChild(starsWrap);

        // 3. Teks komentar ulasan (AMAN DARI XSS DENGAN textContent)
        const commentP = document.createElement('p');
        commentP.className = 'review-item-comment';
        commentP.textContent = rev.comment; // AMAN DARI XSS
        card.appendChild(commentP);

        // 4. Lampiran foto pembeli
        if (Array.isArray(rev.photos) && rev.photos.length > 0) {
          const photoGrid = document.createElement('div');
          photoGrid.className = 'review-attached-photos';

          rev.photos.forEach(photoSrc => {
            const photoThumb = document.createElement('div');
            photoThumb.className = 'review-photo-thumbnail';
            photoThumb.title = 'Klik untuk memperbesar foto';

            const img = document.createElement('img');
            img.src = photoSrc;
            img.alt = `Foto ulasan oleh ${rev.name}`;

            photoThumb.appendChild(img);
            photoThumb.addEventListener('click', () => {
              openLightbox(photoSrc, rev.name, rev.date);
            });

            photoGrid.appendChild(photoThumb);
          });

          card.appendChild(photoGrid);
        }

        feed.appendChild(card);
      });
    }

    // Render awal
    renderAllReviewElements();

    // Subscribe event update jika ada ulasan baru
    window.addEventListener('figure_reviews_updated', (e) => {
      if (e.detail && e.detail.productId === productId) {
        renderAllReviewElements();
      }
    });
  }

  // =========================================================================
  // HELPER UNTUK KARTU PRODUK (GRID INDEX & MENU)
  // =========================================================================

  /**
   * Menampilkan rating bintang dan jumlah ulasan pada kartu produk di index.html & menu.html
   */
  function attachRatingBadgesToProductCards() {
    document.querySelectorAll('.item').forEach(card => {
      // Cari tombol atau data id
      const btn = card.querySelector('[data-product-id]');
      if (!btn) return;

      const productId = btn.getAttribute('data-product-id');
      if (!productId) return;

      // Cek apakah badge rating sudah terpasang
      if (card.querySelector('.card-rating-badge')) return;

      const stats = storage.getAverageRating(productId);

      const ratingBadge = document.createElement('a');
      ratingBadge.className = 'card-rating-badge';
      ratingBadge.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
      ratingBadge.title = `Lihat ulasan untuk produk ini (${stats.total} ulasan)`;

      if (stats.total > 0) {
        ratingBadge.innerHTML = `
          <i class="fas fa-star" style="color: #ffb800;"></i>
          <strong>${stats.average.toFixed(1)}</strong>
          <span class="rating-count-text">(${stats.total})</span>
        `;
      } else {
        ratingBadge.innerHTML = `
          <i class="far fa-star" style="color: #999;"></i>
          <span class="rating-count-text">Belum ada ulasan</span>
        `;
      }

      // Sisipkan di bawah h3 (judul produk)
      const h3 = card.querySelector('h3');
      if (h3 && h3.parentNode) {
        h3.parentNode.insertBefore(ratingBadge, h3.nextSibling);
      }

      // Buat gambar dan nama produk bisa diklik menuju product-detail.html
      const img = card.querySelector('img');
      if (img && !img.closest('a')) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
        });
      }

      if (h3) {
        h3.style.cursor = 'pointer';
        h3.addEventListener('click', () => {
          window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
        });
      }
    });
  }

  // Jalankan inisialisasi pada kartu saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLightbox();
      attachRatingBadgesToProductCards();
    });
  } else {
    initLightbox();
    attachRatingBadgesToProductCards();
  }

  // Re-attach saat data ulasan terupdate
  window.addEventListener('figure_reviews_updated', () => {
    attachRatingBadgesToProductCards();
  });

  // Ekspor API reviews ke global window
  window.figureReviews = {
    setupProductReviewsSection,
    attachRatingBadgesToProductCards,
    openLightbox,
    closeLightbox,
    compressImage
  };
})();
