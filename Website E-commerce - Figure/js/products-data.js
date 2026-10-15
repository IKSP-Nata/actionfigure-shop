/**
 * Data Master Produk Action Figure
 * Berisi informasi ID, nama, harga (dalam Rupiah), stok yang tersedia, ukuran, gambar, dan deskripsi produk.
 * Catatan: Beberapa produk diset stok: 0 untuk keperluan pengujian fitur "Kabari Saya Kalau Ready".
 */
const PRODUCTS_DATA = {
  // Hero Best Seller
  'geto-hero': {
    id: 'geto-hero',
    name: 'Figure Geto (Best Seller)',
    price: 5000000,
    stock: 3,
    image: 'assets/gto.png',
    size: 'Big (32cm)',
    series: 'Jujutsu Kaisen',
    description: 'Action figure Suguru Geto edisi kolektor berskala besar. Menampilkan detail jubah biksu khas Geto dengan pose dominan, material PVC kualitas tinggi dan base penyangga kokoh eksklusif.'
  },

  // Main Products Grid
  'choso': {
    id: 'choso',
    name: 'Figure Choso',
    price: 100000,
    stock: 8,
    image: 'assets/khoso.png',
    size: 'Small (16cm)',
    series: 'Jujutsu Kaisen',
    description: 'Figur Choso Death Painting Womb sulung dengan efek teknik Blood Manipulation di tangan. Detail ekspresi wajah melankolis dan cat jubah yang sangat presisi.'
  },
  'gojoo': {
    id: 'gojoo',
    name: 'Figure Gojoo',
    price: 175000,
    stock: 5,
    image: 'assets/movjga.png',
    size: 'Small (18cm)',
    series: 'Jujutsu Kaisen',
    description: 'Satoru Gojo dengan penutup mata hitam ikonik dan seragam SMA Jujutsu Tokyo. Sangat cocok dipajang di meja kerja atau lemari pajangan koleksi anime.'
  },
  'sukuna': {
    id: 'sukuna',
    name: 'Figure Sukuna',
    price: 250000,
    stock: 0, // STOK HABIS untuk menguji fitur "Kabari Saya Kalau Ready"
    image: 'assets/sukuna.jpeg',
    size: 'Small (17cm)',
    series: 'Jujutsu Kaisen',
    description: 'Raja Kutukan Ryomen Sukuna dalam wujud Itadori dengan tato kutukan menyala. Figur ini saat ini sedang habis terjual karena peminat yang sangat tinggi.'
  },
  'gojo-satoru': {
    id: 'gojo-satoru',
    name: 'Figure Gojo Satoru',
    price: 300000,
    stock: 4,
    image: 'assets/bgjo.png',
    size: 'Big (25cm)',
    series: 'Jujutsu Kaisen',
    description: 'Figur skala besar Satoru Gojo dengan pose jurus Hollow Purple. Efek energi kutukan tembus pandang berbahan resin mika memberikan kesan magis yang spektakuler.'
  },
  'chosoo': {
    id: 'chosoo',
    name: 'Figure Chosoo',
    price: 110000,
    stock: 7,
    image: 'assets/hosoo.jpg',
    size: 'Small (16cm)',
    series: 'Jujutsu Kaisen',
    description: 'Varian pose alternatif Choso dengan kuda-kuda siaga Piercing Blood. Pilihan favorit penggemar anime JJK Shibuya Incident.'
  },
  'gojo-open-eyes': {
    id: 'gojo-open-eyes',
    name: 'Figure Gojo Open Eyes',
    price: 180000,
    stock: 0, // STOK HABIS untuk menguji fitur "Kabari Saya Kalau Ready"
    image: 'assets/jogo.jpeg',
    size: 'Small (18cm)',
    series: 'Jujutsu Kaisen',
    description: 'Figur Gojo Satoru membuka penutup mata memperlihatkan teknik mata Six Eyes biru bercahaya (Domain Expansion: Infinite Void). Stok saat ini kosong.'
  },
  'megumi': {
    id: 'megumi',
    name: 'Figure Megumi',
    price: 50000,
    stock: 10,
    image: 'assets/removegumi.png',
    size: 'Mini (10cm)',
    series: 'Jujutsu Kaisen',
    description: 'Megumi Fushiguro edisi chibi mini yang imut dengan pose memanggil Divine Dog. Cocok untuk gantungan atau pajangan dashboard mobil.'
  },
  'megumi-nue': {
    id: 'megumi-nue',
    name: 'Figure Megumi With Nue',
    price: 320000,
    stock: 4,
    image: 'assets/nue.jpg',
    size: 'Medium (20cm)',
    series: 'Jujutsu Kaisen',
    description: 'Diorama lengkap Megumi Fushiguro bersama Shikigami burung Nue berpetir listrik. Pengerjaan sayap Nue sangat hidup dengan gradasi warna bulu yang memukau.'
  },
  'paket-figure': {
    id: 'paket-figure',
    name: 'Paket Figure Anime',
    price: 450000,
    stock: 3,
    image: 'assets/paket.jpg',
    size: 'Special Bundle',
    series: 'Anime Mix',
    description: 'Paket hemat kolektor berisi 3 figur anime pilihan berkualitas tinggi dalam satu kemasan kotak eksklusif berstempel original.'
  },
  'yuji': {
    id: 'yuji',
    name: 'Figure Itadori Yuji',
    price: 2000000,
    stock: 2,
    image: 'assets/yuji.jpeg',
    size: 'Big (30cm)',
    series: 'Jujutsu Kaisen',
    description: 'Masterpiece scale figure Itadori Yuji dengan efek Black Flash (Kokusen) menyala. Sangat kokoh, berat, dan menjadi pusat perhatian di etalase Anda.'
  },
  'inumaki': {
    id: 'inumaki',
    name: 'Figure Inumaki',
    price: 350000,
    stock: 5,
    image: 'assets/inumaki.jpg',
    size: 'Small (17cm)',
    series: 'Jujutsu Kaisen',
    description: 'Toge Inumaki pengguna Cursed Speech dengan resleting kerah terbuka dan simbol ular taring kutukan di lidah serta kedua sudut mulutnya.'
  },
  'asta': {
    id: 'asta',
    name: 'Figure Asta',
    price: 200000,
    stock: 6,
    image: 'assets/asta.png',
    size: 'Small (17cm)',
    series: 'Black Clover',
    description: 'Asta dari Black Clover mengayunkan pedang Demon-Slayer raksasa anti-sihir dengan aura kegelapan iblis Liebe di sekeliling tubuhnya.'
  },
  'nobara': {
    id: 'nobara',
    name: 'Figure Nobara',
    price: 120000,
    stock: 8,
    image: 'assets/remover.png',
    size: 'Small (16cm)',
    series: 'Jujutsu Kaisen',
    description: 'Nobara Kugisaki dengan palu dan paku bertali jerami teknik Resonance (Hairbinger). Menampilkan pesona gadis Jujutsu yang tangguh dan karismatik.'
  },
  'noelle': {
    id: 'noelle',
    name: 'Figure Noelle',
    price: 220000,
    stock: 5,
    image: 'assets/noelle.png',
    size: 'Medium (19cm)',
    series: 'Black Clover',
    description: 'Noelle Silva mengenakan Valkyrie Dress baju besi air dengan tombak naga air berkilauan. Pewarnaan mutiara metalik yang sangat anggun.'
  },
  'zoro': {
    id: 'zoro',
    name: 'Figure Zoro',
    price: 280000,
    stock: 4,
    image: 'assets/zoro.png',
    size: 'Medium (21cm)',
    series: 'One Piece',
    description: 'Roronoa Zoro mode Santoryu (tiga pedang: Wado Ichimonji, Sandai Kitetsu, dan Enma) dengan jubah Wano Kuni hijau legendaris.'
  },
  'mahito': {
    id: 'mahito',
    name: 'Figure Mahito',
    price: 200000,
    stock: 5,
    image: 'assets/mahito.jpg',
    size: 'Small (18cm)',
    series: 'Jujutsu Kaisen',
    description: 'Roh Kutukan Mahito dengan teknik Idle Transfiguration, lengan mutasi berotot dan base bebatuan hancur bernuansa kelam.'
  },
  'minato': {
    id: 'minato',
    name: 'Figure Minato',
    price: 250000,
    stock: 5,
    image: 'assets/minato.png',
    size: 'Medium (20cm)',
    series: 'Naruto Shippuden',
    description: 'Minato Namikaze sang Kilat Kuning Konoha (Yondaime Hokage) berpose dinamis memegang kunai Hiraishin dengan jubah putih berkibar.'
  },

  // Paket Harga / Pricing Table
  'pkg-basic': {
    id: 'pkg-basic',
    name: 'Paket Basic Figure (Gojo, Mahito, Minato, Yuji)',
    price: 500000,
    stock: 5,
    image: 'assets/paket.jpg',
    size: 'Package',
    series: 'Bundle Set',
    description: 'Paket hemat figur karakter favorit pilihan penggemar.'
  },
  'pkg-special': {
    id: 'pkg-special',
    name: 'Paket Special Figure (Inumaki, Choso, Zoro, Megumi)',
    price: 1000000,
    stock: 4,
    image: 'assets/paket.jpg',
    size: 'Package',
    series: 'Bundle Set',
    description: 'Paket spesial figur aksi lengkap dengan aksesoris tambahan.'
  },
  'pkg-premium': {
    id: 'pkg-premium',
    name: 'Paket Premium Figure (Gojo, Mahito, Minato, Yuji)',
    price: 1500000,
    stock: 3,
    image: 'assets/paket.jpg',
    size: 'Package',
    series: 'Bundle Set',
    description: 'Paket premium kolektor dengan figur ukuran besar dan kemasan pelindung ekstra.'
  }
};

// Fungsi pembantu untuk mengambil data produk dengan aman
window.getProductById = function(productId) {
  return PRODUCTS_DATA[productId] || null;
};

// Ekspor ke window
window.PRODUCTS_DATA = PRODUCTS_DATA;
