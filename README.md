# KelapaKu Marketplace

Bertindaklah sebagai Senior Full-Stack Web Developer, UI/UX Designer, dan Database Engineer yang berpengalaman dalam membangun website e-commerce.
Buat website e-commerce bernama KelapaKu, yaitu platform penjualan produk kelapa dan olahan kelapa yang mendukung pembelian eceran maupun grosir.
Website harus memiliki desain modern, profesional, responsif, mudah digunakan, serta memiliki sistem admin untuk mengelola seluruh aktivitas toko.
Gunakan database Supabase yang sudah terhubung dengan project ini.
PENTING:
- Jangan membuat ulang database Supabase.
- Jangan menghapus tabel yang sudah ada.
- Jangan mengubah struktur database tanpa alasan yang jelas dan persetujuan.
- Periksa terlebih dahulu seluruh tabel, kolom, relasi, enum, trigger, dan RLS yang tersedia.
- Gunakan struktur database yang sudah ada sebagai acuan utama.
- Jangan menggunakan data dummy jika data asli dari Supabase sudah tersedia.
- Jangan hanya membuat tampilan frontend. Seluruh fitur harus terhubung dengan backend Supabase.
2. Identitas Website
Nama website: KelapaKu
Jenis website: E-commerce produk kelapa dan olahan kelapa.
Konsep desain:
- Modern
- Minimalis
- Natural
- Profesional
- Fresh
- Ramah lingkungan
Warna utama:
- Hijau tua: #245C3A
- Hijau muda: #A8C686
- Putih: #FFFFFF
- Krem: #F5F0E6
- Cokelat natural: #8B5E3C
Gunakan font modern yang mudah dibaca, seperti Poppins atau Inter.
Desain harus memiliki:
- Navbar yang rapi.
- Hero section yang menarik.
- Foto produk berkualitas.
- Kartu produk dengan sudut rounded.
- Tombol CTA yang jelas.
- Animasi ringan dan tidak berlebihan.
- Layout responsif untuk desktop, tablet, dan mobile.
3. Struktur Halaman Website
Buat halaman berikut:
A. Beranda
URL: /
Isi halaman:
- Navbar dengan logo KelapaKu.
- Menu Beranda.
- Menu Produk.
- Menu Tentang Kami.
- Menu Kontak.
- Tombol Login dan Daftar.
- Hero section dengan headline:
  "Solusi Produk Kelapa Berkualitas untuk Kebutuhan Anda"
- Subheadline:
  "Belanja produk kelapa segar dan olahan kelapa dengan harga terbaik, baik eceran maupun grosir."
- Tombol "Belanja Sekarang".
- Kategori produk.
- Produk unggulan yang diambil dari database Supabase.
- Section keunggulan KelapaKu.
- Section layanan pembelian grosir.
- Footer berisi informasi website, kontak, dan navigasi.
B. Halaman Produk
URL: /products
Fitur:
- Menampilkan seluruh produk dari tabel products.
- Mengambil kategori dari tabel categories.
- Filter berdasarkan kategori.
- Search produk berdasarkan nama.
- Sort berdasarkan harga termurah dan termahal.
- Menampilkan gambar produk.
- Menampilkan nama produk.
- Menampilkan harga.
- Menampilkan stok.
- Menampilkan satuan produk.
- Tombol "Lihat Detail".
- Tombol "Tambah ke Keranjang".
Produk hanya ditampilkan jika statusnya aktif.
C. Detail Produk
URL: /products/:slug
Fitur:
- Menampilkan detail produk dari Supabase.
- Menampilkan gambar produk dari product_images.
- Menampilkan deskripsi produk.
- Menampilkan harga eceran.
- Menampilkan satuan.
- Menampilkan stok.
- Menampilkan pilihan jumlah pembelian.
- Menampilkan harga grosir jika tersedia dari product_price_tiers.
- Tombol tambah ke keranjang.
- Validasi jumlah pembelian agar tidak melebihi stok.
D. Login
URL: /login
Fitur:
- Login menggunakan email dan password.
- Menggunakan Supabase Authentication.
- Validasi form.
- Menampilkan pesan error jika login gagal.
- Redirect berdasarkan role pengguna.
Jika role admin, arahkan ke dashboard admin.
Jika role customer, arahkan ke halaman pelanggan.
E. Registrasi
URL: /register
Fitur:
- Nama lengkap.
- Email.
- Password.
- Konfirmasi password.
- Registrasi menggunakan Supabase Authentication.
- Simpan data profil ke tabel profiles sesuai struktur yang tersedia.
- Role default harus customer.
- Pengguna tidak boleh memilih role admin ketika mendaftar.
F. Keranjang Belanja
URL: /cart
Gunakan tabel cart_items.
Fitur:
- Menampilkan produk yang dimasukkan ke keranjang.
- Mengubah jumlah produk.
- Menghapus produk.
- Menghitung subtotal.
- Menghitung total belanja.
- Validasi stok produk.
- Keranjang harus tersimpan untuk pengguna yang login.
- Data keranjang tidak boleh bisa diakses oleh pengguna lain.
G. Checkout
URL: /checkout
Gunakan tabel:
- addresses
- cart_items
- orders
- order_items
Fitur:
- Memilih alamat pengiriman.
- Menampilkan ringkasan pesanan.
- Menampilkan jumlah produk.
- Menampilkan subtotal.
- Menampilkan total pembayaran.
- Form catatan pesanan.
- Membuat pesanan ke database Supabase.
- Mengosongkan keranjang setelah pesanan berhasil dibuat.
- Validasi data checkout.
- Mencegah stok menjadi negatif.
- Pastikan proses checkout aman dan tidak membuat pesanan ganda.
H. Riwayat Pesanan
URL: /my-orders
Gunakan tabel orders dan order_items.
Fitur:
- Menampilkan riwayat pesanan pengguna.
- Nomor pesanan.
- Tanggal pesanan.
- Total pembayaran.
- Status pesanan.
- Detail pesanan.
- Status pembayaran.
- Pengguna hanya dapat melihat pesanan miliknya sendiri.
I. Profil Pengguna
URL: /profile
Gunakan tabel profiles dan addresses.
Fitur:
- Menampilkan nama pengguna.
- Email.
- Nomor telepon.
- Edit profil.
- Mengelola alamat pengiriman.
- Menambahkan alamat.
- Mengedit alamat.
- Menghapus alamat.
- Menyimpan perubahan ke Supabase.
4. Dashboard Admin
URL: /admin
Buat dashboard admin yang modern, profesional, dan memiliki sidebar.
Dashboard hanya dapat diakses oleh pengguna dengan role admin yang tersimpan di tabel profiles.
Jangan hanya menyembunyikan tombol admin dari customer. Lakukan validasi role pada backend dan gunakan kebijakan RLS Supabase yang sudah tersedia.
A. Dashboard Overview
Tampilkan:
- Total produk.
- Total kategori.
- Total pesanan.
- Total pelanggan.
- Total pendapatan berdasarkan pesanan yang sudah dibayar.
- Pesanan terbaru.
- Produk dengan stok rendah.
- Grafik penjualan.
Data harus diambil dari Supabase.
B. Manajemen Produk
URL: /admin/products
Gunakan tabel products.
Fitur:
- Menampilkan seluruh produk.
- Tambah produk.
- Edit produk.
- Hapus produk.
- Mengubah status aktif produk.
- Mengatur harga.
- Mengatur stok.
- Mengatur satuan.
- Mengatur kategori.
- Upload gambar produk ke Supabase Storage bucket product-images.
- Mengelola gambar produk melalui product_images.
Form produk harus sesuai dengan kolom database yang tersedia.
C. Manajemen Kategor
URL: /admin/categories
Gunakan tabel categories.
Fitur:
- Tambah kategori.
- Edit kategori.
- Hapus kategori.
- Mengatur nama kategori.
- Mengatur slug.
- Mengatur deskripsi.
- Mengatur status aktif.
D. Manajemen Pesanan
URL: /admin/orders
Gunakan tabel orders dan order_items.
Fitur:
- Menampilkan semua pesanan.
- Melihat detail pesanan.
- Melihat data pelanggan.
- Melihat alamat pengiriman.
- Melihat produk yang dibeli.
- Mengubah status pesanan sesuai nilai enum database yang tersedia.
- Filter pesanan berdasarkan status.
- Search berdasarkan nomor pesanan.
- Menampilkan tanggal pesanan dan total pembayaran.
E. Manajemen Pelanggan
URL: /admin/customers
Gunakan tabel profiles.
Fitur:
- Menampilkan daftar pelanggan.
- Nama pelanggan.
- Email.
- Nomor telepon.
- Role.
- Account type.
- Detail profil pelanggan.
Admin tidak boleh mengubah role dirinya sendiri secara tidak sengaja.
F. Manajemen Pembayaran
URL: /admin/payments
Gunakan tabel payments.
Fitur:
- Menampilkan data pembayaran.
- Menampilkan nomor pesanan.
- Metode pembayaran.
- Jumlah pembayaran.
- Status pembayaran.
- Tanggal pembayaran.
Jangan membuat pembayaran palsu atau menyatakan pembayaran berhasil tanpa verifikasi.
G. Manajemen Harga Grosir
URL: /admin/wholesale
Gunakan tabel:
- product_price_tiers
- wholesale_applications
Fitur:
- Mengatur harga grosir produk.
- Mengatur minimal jumlah pembelian.
- Mengatur maksimal jumlah pembelian jika tersedia.
- Menampilkan pengajuan pelanggan grosir.
- Menyetujui atau menolak pengajuan grosir.
- Menggunakan account_type dan status sesuai struktur database yang tersedia.
H. Manajemen Penawaran
URL: /admin/quotations
Gunakan tabel:
- quotations
- quotation_items
Fitur:
- Menampilkan permintaan penawaran.
- Melihat detail penawaran.
- Mengatur status penawaran.
- Menampilkan item produk dalam penawaran.
5. Integrasi Supabase
Gunakan Supabase sebagai backend utama.
Integrasikan:
- Supabase Authentication.
- Supabase Database.
- Supabase Storage.
- Supabase Row Level Security.
Tabel yang sudah tersedia dalam database:
- profiles
- categories
- products
- product_images
- product_price_tiers
- wholesale_applications
- addresses
- cart_items
- orders
- order_items
- payments
- quotations
- quotation_items
Pastikan relasi antar tabel digunakan dengan benar.
Jangan mengasumsikan nama kolom yang belum diperiksa.
Sebelum membuat query, periksa schema database dan sesuaikan implementasi dengan nama kolom serta relasi sebenarnya.
Gunakan environment variables untuk Supabase URL dan anon key.
Jangan pernah menaruh service_role key di frontend.
6. Keamanan
Implementasikan keamanan dengan benar:
- Gunakan Supabase Auth untuk autentikasi.
- Terapkan RLS pada seluruh tabel yang memiliki data pengguna.
- Customer hanya dapat melihat dan mengubah data miliknya.
- Admin dapat mengakses data administrasi sesuai kebijakan yang tersedia.
- Role admin harus divalidasi dari database.
- Jangan memberikan akses admin berdasarkan email yang ditulis secara hardcode.
- Jangan mengizinkan customer mengubah role menjadi admin.
- Jangan mengekspos service_role key.
- Validasi semua input form.
- Gunakan server-side logic atau database function yang aman untuk proses sensitif seperti checkout dan perubahan stok.
Jika ada kebijakan RLS yang belum mendukung suatu fitur, laporkan terlebih dahulu dan berikan rekomendasi perubahan. Jangan menonaktifkan RLS secara sembarangan.
7. Teknologi
Gunakan:
- React.
- TypeScript.
- Tailwind CSS.
- Komponen UI modern.
- Supabase.
- React Router.
- Lucide Icons.
Gunakan struktur kode yang rapi, reusable, dan mudah dikembangkan.
Buat komponen terpisah untuk:
- Navbar.
- Footer.
- ProductCard.
- ProductGrid.
- SidebarAdmin.
- AdminHeader.
- DataTable.
- FormProduct.
- FormCategory.
- FormCheckout.
- LoadingState.
- EmptyState.
- ErrorState.
8. Pengalaman Pengguna
Website harus:
- Mudah digunakan.
- Responsif di desktop dan mobile.
- Memiliki loading state.
- Memiliki empty state.
- Memiliki error handling.
- Menampilkan toast notification.
- Menampilkan konfirmasi sebelum menghapus data.
- Tidak menggunakan alert browser yang mengganggu.
- Memiliki navigasi yang jelas.
- Memiliki tampilan yang konsisten.
Gunakan bahasa Indonesia pada seluruh antarmuka website.
9. Instruksi Pengerjaan
Lakukan pengerjaan dengan tahapan berikut:
TAHAP 1:
Periksa koneksi Supabase dan schema database yang tersedia. Pastikan semua tabel, kolom, relasi, enum, serta RLS dapat dipahami.
TAHAP 2:
Buat struktur frontend dan desain website KelapaKu dengan tampilan modern dan responsif.
TAHAP 3:
Buat halaman beranda, katalog produk, detail produk, login, dan registrasi.
TAHAP 4:
Implementasikan integrasi Supabase Authentication dan profil pengguna.
TAHAP 5:
Implementasikan keranjang belanja, checkout, alamat, serta riwayat pesanan.
TAHAP 6:
Buat dashboard admin beserta seluruh fitur manajemen.
TAHAP 7:
Lakukan pengujian koneksi database dan seluruh fungsi website.
Jangan berhenti pada tampilan visual saja.
Setiap tombol harus memiliki fungsi yang benar.
Setiap form harus dapat menyimpan data ke Supabase.
Setiap halaman yang menampilkan data harus mengambil data dari database.
Jika terdapat masalah schema, relasi, atau RLS, jelaskan secara spesifik dan jangan mengarang solusinya.
10. Hasil Akhir
Buat website KelapaKu yang:
- Siap dikembangkan menjadi e-commerce.
- Terhubung dengan Supabase.
- Memiliki halaman customer.
- Memiliki dashboard admin.
- Memiliki sistem pembelian eceran dan grosir.
- Memiliki manajemen produk dan pesanan.
- Memiliki desain modern dan profesional.
- Memiliki sistem keamanan yang baik.
Mulai dari pemeriksaan Supabase dan implementasi tahap pertama.
Setelah tahap pertama selesai, jelaskan kepada saya:
1. Apa saja yang sudah berhasil dibuat.
2. Halaman apa saja yang sudah tersedia.
3. Fitur apa saja yang sudah terhubung ke Supabase.
4. Fitur apa saja yang belum selesai.
5. Apakah ada masalah schema atau RLS yang perlu diperbaiki.
Jangan membuat ulang database. Gunakan database Supabase yang sudah saya siapkan sebelumnya.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f959b3d-6c20-4ac5-a8cc-dfbb2e3595bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
