/**
 * Data Master Produk Action Figure
 * Berisi informasi ID, nama, harga (dalam Rupiah), stok yang tersedia, dan gambar produk.
 */
const PRODUCTS_DATA = {
  // Hero Best Seller
  'geto-hero': {
    id: 'geto-hero',
    name: 'Figure Geto (Best Seller)',
    price: 5000000,
    stock: 3,
    image: 'assets/gto.png',
    size: 'Big'
  },

  // Main Products Grid
  'choso': {
    id: 'choso',
    name: 'Figure Choso',
    price: 100000,
    stock: 8,
    image: 'assets/khoso.png',
    size: 'Small'
  },
  'gojoo': {
    id: 'gojoo',
    name: 'Figure Gojoo',
    price: 175000,
    stock: 5,
    image: 'assets/movjga.png',
    size: 'Small'
  },
  'sukuna': {
    id: 'sukuna',
    name: 'Figure Sukuna',
    price: 250000,
    stock: 6,
    image: 'assets/sukuna.jpeg',
    size: 'Small'
  },
  'gojo-satoru': {
    id: 'gojo-satoru',
    name: 'Figure Gojo Satoru',
    price: 300000,
    stock: 4,
    image: 'assets/bgjo.png',
    size: 'Big'
  },
  'chosoo': {
    id: 'chosoo',
    name: 'Figure Chosoo',
    price: 110000,
    stock: 7,
    image: 'assets/hosoo.jpg',
    size: 'Small'
  },
  'gojo-open-eyes': {
    id: 'gojo-open-eyes',
    name: 'Figure Gojo Open Eyes',
    price: 180000,
    stock: 5,
    image: 'assets/jogo.jpeg',
    size: 'Small'
  },
  'megumi': {
    id: 'megumi',
    name: 'Figure Megumi',
    price: 50000,
    stock: 10,
    image: 'assets/removegumi.png',
    size: 'Mini'
  },
  'megumi-nue': {
    id: 'megumi-nue',
    name: 'Figure Megumi With Nue',
    price: 320000,
    stock: 4,
    image: 'assets/nue.jpg',
    size: 'Medium'
  },
  'paket-figure': {
    id: 'paket-figure',
    name: 'Paket Figure Anime',
    price: 450000,
    stock: 3,
    image: 'assets/paket.jpg',
    size: 'Special Bundle'
  },
  'yuji': {
    id: 'yuji',
    name: 'Figure Itadori Yuji',
    price: 2000000,
    stock: 2,
    image: 'assets/yuji.jpeg',
    size: 'Big'
  },
  'inumaki': {
    id: 'inumaki',
    name: 'Figure Inumaki',
    price: 350000,
    stock: 5,
    image: 'assets/inumaki.jpg',
    size: 'Small'
  },
  'asta': {
    id: 'asta',
    name: 'Figure Asta',
    price: 200000,
    stock: 6,
    image: 'assets/asta.png',
    size: 'Small'
  },
  'nobara': {
    id: 'nobara',
    name: 'Figure Nobara',
    price: 120000,
    stock: 8,
    image: 'assets/remover.png',
    size: 'Small'
  },
  'noelle': {
    id: 'noelle',
    name: 'Figure Noelle',
    price: 220000,
    stock: 5,
    image: 'assets/noelle.png',
    size: 'Medium'
  },
  'zoro': {
    id: 'zoro',
    name: 'Figure Zoro',
    price: 280000,
    stock: 4,
    image: 'assets/zoro.png',
    size: 'Medium'
  },
  'mahito': {
    id: 'mahito',
    name: 'Figure Mahito',
    price: 200000,
    stock: 5,
    image: 'assets/mahito.jpg',
    size: 'Small'
  },
  'minato': {
    id: 'minato',
    name: 'Figure Minato',
    price: 250000,
    stock: 5,
    image: 'assets/minato.png',
    size: 'Medium'
  },

  // Paket Harga / Pricing Table
  'pkg-basic': {
    id: 'pkg-basic',
    name: 'Paket Basic Figure (Gojo, Mahito, Minato, Yuji)',
    price: 500000,
    stock: 5,
    image: 'assets/paket.jpg',
    size: 'Package'
  },
  'pkg-special': {
    id: 'pkg-special',
    name: 'Paket Special Figure (Inumaki, Choso, Zoro, Megumi)',
    price: 1000000,
    stock: 4,
    image: 'assets/paket.jpg',
    size: 'Package'
  },
  'pkg-premium': {
    id: 'pkg-premium',
    name: 'Paket Premium Figure (Gojo, Mahito, Minato, Yuji)',
    price: 1500000,
    stock: 3,
    image: 'assets/paket.jpg',
    size: 'Package'
  }
};

// Ekspor ke window agar dapat diakses oleh modul lain
window.PRODUCTS_DATA = PRODUCTS_DATA;
