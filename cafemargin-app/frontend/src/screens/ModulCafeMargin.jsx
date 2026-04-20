'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowLeft, Search, GraduationCap } from 'lucide-react'
import AppLayout from '../components/Layout/AppLayout'

const CAT_COLOR = {
  'Fondasi Keuangan':    'bg-amber-100 text-amber-800',
  'Unit Economics':      'bg-green-100 text-green-800',
  'HPP & Menu':          'bg-orange-100 text-orange-800',
  'Biaya Operasional':   'bg-blue-100 text-blue-800',
  'Cashflow':            'bg-teal-100 text-teal-800',
  'Harga & Promosi':     'bg-pink-100 text-pink-800',
  'Laporan & KPI':       'bg-purple-100 text-purple-800',
  'Sistem & Otomasi':    'bg-cyan-100 text-cyan-800',
  'Kontrol Internal':    'bg-red-100 text-red-800',
  'Risiko & Legal':      'bg-gray-100 text-gray-700',
  'Pertumbuhan & AI':    'bg-violet-100 text-violet-800',
  'Analitik Lanjutan':   'bg-indigo-100 text-indigo-800',
  'Problem Solving':     'bg-rose-100 text-rose-800',
  'Platform CafeMargin': 'bg-brand-100 text-brand-800',
}

const MODULES = [
  {
    id: 1,
    image: '/materi/1.png',
    title: 'Laporan Laba Rugi (P&L)',
    category: 'Fondasi Keuangan',
    paragraphs: [
      'Laporan Laba Rugi atau Profit & Loss (P&L) adalah dokumen keuangan paling penting bagi setiap pemilik cafe. Dokumen ini merangkum seluruh pendapatan yang masuk dan seluruh biaya yang keluar dalam satu periode waktu tertentu, biasanya bulanan atau tahunan. Dari selisih keduanya, kita bisa melihat apakah bisnis menghasilkan keuntungan atau justru merugi.',
      'Struktur dasar P&L terdiri dari tiga lapisan utama. Pertama, Gross Revenue yaitu total penjualan sebelum dikurangi diskon. Kedua, Cost of Goods Sold (HPP) yaitu biaya langsung untuk memproduksi menu yang terjual. Ketiga, Operating Expenses yaitu biaya operasional seperti gaji, sewa, dan listrik. Keuntungan bersih diperoleh setelah semua lapisan biaya dikurangkan dari revenue.',
      'Bagi cafe owner, membaca P&L secara rutin setiap bulan adalah kebiasaan yang wajib dibangun. Bandingkan angka bulan ini dengan bulan lalu dan tahun lalu untuk memahami tren bisnis Anda. Jika margin terus menurun padahal revenue stabil, itu sinyal bahwa ada biaya yang perlu segera dikendalikan.',
    ],
  },
  {
    id: 2,
    image: '/materi/2.png',
    title: 'Memahami Revenue Cafe',
    category: 'Fondasi Keuangan',
    paragraphs: [
      'Revenue atau pendapatan adalah total uang yang diterima cafe dari penjualan menu dan layanan. Revenue bukan profit — ini adalah angka kotor sebelum dikurangi biaya apapun. Memahami dari mana revenue berasal, kapan puncaknya, dan produk mana yang paling berkontribusi adalah kunci untuk membuat keputusan bisnis yang tepat.',
      'Revenue cafe dapat dianalisis dari berbagai dimensi: per produk (menu mana yang paling laku), per jam (kapan traffic tertinggi), per hari dalam seminggu (weekday vs weekend), dan per channel (makan di tempat, take away, atau delivery). Setiap dimensi memberikan wawasan berbeda yang bisa digunakan untuk mengoptimalkan operasional dan strategi marketing.',
      'Kesalahan umum cafe owner adalah hanya fokus pada total revenue bulanan tanpa memahami komposisinya. Revenue tinggi dari produk bermargin rendah justru bisa menguras energi dan resources tanpa menghasilkan profit yang sepadan. Fokus pada kualitas revenue, bukan hanya kuantitasnya, agar pertumbuhan bisnis Anda benar-benar berkelanjutan.',
    ],
  },
  {
    id: 3,
    image: '/materi/3.png',
    title: 'Komponen Biaya Utama Cafe',
    category: 'Fondasi Keuangan',
    paragraphs: [
      'Biaya operasional cafe terbagi menjadi dua kategori besar: biaya variabel dan biaya tetap. Biaya variabel berubah seiring dengan jumlah penjualan, misalnya biaya bahan baku kopi, susu, dan makanan. Biaya tetap tidak berubah meskipun penjualan naik atau turun, seperti sewa tempat, gaji karyawan tetap, dan cicilan peralatan.',
      'Dalam industri F&B, terdapat benchmark biaya yang bisa dijadikan acuan kesehatan bisnis. Food & Beverage Cost idealnya berada di 28–35% dari revenue, Labor Cost di 25–35%, dan Overhead seperti sewa dan listrik di 15–20%. Jika ketiga komponen ini terkontrol dalam rentang tersebut, net margin cafe Anda seharusnya berada di angka 15–25%.',
      'Pemantauan biaya tidak bisa dilakukan hanya sekali sebulan. Biaya bahan baku perlu dicek harian karena fluktuasi harga pemasok. Biaya tenaga kerja perlu dikontrol mingguan melalui jadwal shift yang efisien. Dengan monitoring yang konsisten, Anda bisa mengidentifikasi pembengkakan biaya lebih awal dan mengambil tindakan sebelum dampaknya terasa di laporan akhir bulan.',
    ],
  },
  {
    id: 4,
    image: '/materi/4.png',
    title: 'Menghitung Margin Cafe',
    category: 'Fondasi Keuangan',
    paragraphs: [
      'Margin adalah persentase keuntungan dari setiap rupiah yang diterima sebagai pendapatan. Ada dua jenis margin yang paling penting untuk dipahami: Gross Margin dan Net Margin. Gross Margin dihitung dari Revenue dikurangi HPP (Harga Pokok Penjualan), sedangkan Net Margin dihitung dari Revenue dikurangi seluruh biaya termasuk operasional.',
      'Rumus sederhana menghitung margin: Margin (%) = (Revenue – Biaya) / Revenue × 100. Misalnya, jika revenue bulanan Rp 50 juta dan total biaya Rp 40 juta, maka Net Margin adalah 20%. Angka ini berarti dari setiap Rp 100 yang masuk, Rp 20 adalah keuntungan bersih. Semakin tinggi margin, semakin sehat bisnis Anda.',
      'Margin di industri cafe bervariasi tergantung konsep dan lokasi. Specialty coffee shop premium bisa memiliki gross margin di atas 70%, sementara cafe dengan konsep makanan berat biasanya berada di 55–65%. Yang terpenting bukan hanya angka margin itu sendiri, tetapi tren margin dari waktu ke waktu — apakah stabil, meningkat, atau terus menurun.',
    ],
  },
  {
    id: 5,
    image: '/materi/5.png',
    title: 'Gross Margin vs Net Margin',
    category: 'Fondasi Keuangan',
    paragraphs: [
      'Gross Margin mengukur profitabilitas produk sebelum biaya operasional dihitung. Angka ini mencerminkan efisiensi dalam memproduksi menu — apakah harga jual sudah cukup jauh di atas Harga Pokok Penjualan (HPP). Gross Margin yang tinggi memberi cafe ruang untuk menutup biaya operasional dan masih meninggalkan keuntungan bersih.',
      'Net Margin adalah angka profitabilitas sesungguhnya setelah semua biaya — termasuk sewa, gaji, listrik, dan marketing — dikurangkan dari revenue. Ini adalah angka yang paling relevan untuk mengukur kesehatan bisnis secara keseluruhan. Cafe bisa memiliki Gross Margin tinggi tetapi Net Margin sangat tipis jika biaya operasionalnya tidak terkontrol.',
      'Memahami perbedaan keduanya membantu Anda mendiagnosis masalah bisnis lebih akurat. Jika Gross Margin bagus tetapi Net Margin buruk, masalahnya ada di efisiensi operasional — cek biaya sewa, staffing, dan overhead. Jika Gross Margin sendiri sudah rendah, masalahnya ada di pricing atau HPP — saatnya mengevaluasi menu dan negosiasi harga pemasok.',
    ],
  },
  {
    id: 6,
    image: '/materi/6.png',
    title: 'Konsep Unit Economics Cafe',
    category: 'Unit Economics',
    paragraphs: [
      'Unit Economics adalah cara mengukur profitabilitas bisnis di level unit terkecil — dalam konteks cafe, "unit" bisa berupa satu transaksi, satu cangkir kopi, atau satu meja per jam. Dengan memahami unit economics, Anda bisa mengetahui apakah setiap aktivitas bisnis benar-benar menghasilkan nilai, dan di mana letak ketidakefisienan.',
      'Dua metrik inti unit economics untuk cafe adalah Customer Acquisition Cost (CAC) — berapa biaya untuk mendapatkan satu pelanggan baru — dan Customer Lifetime Value (CLV) — berapa total revenue yang dihasilkan seorang pelanggan selama menjadi pelanggan setia Anda. Bisnis sehat ketika CLV setidaknya 3× lebih besar dari CAC.',
      'Unit economics juga membantu dalam keputusan ekspansi. Sebelum membuka cabang baru, pastikan unit economics di cabang pertama sudah solid. Cabang baru yang dibuka tanpa unit economics yang proven hanya akan melipatgandakan masalah, bukan melipatgandakan keuntungan. Validasi model bisnis di satu lokasi sebelum menduplikasinya.',
    ],
  },
  {
    id: 7,
    image: '/materi/7.png',
    title: 'Revenue Per Transaksi',
    category: 'Unit Economics',
    paragraphs: [
      'Average Transaction Value (ATV) atau nilai rata-rata per transaksi adalah salah satu metrik paling actionable dalam bisnis cafe. ATV dihitung dengan membagi total revenue dengan jumlah transaksi dalam periode yang sama. Angka ini memberi gambaran langsung tentang berapa besar "belanja rata-rata" setiap pelanggan yang datang ke cafe Anda.',
      'Meningkatkan ATV bisa dilakukan tanpa perlu menambah jumlah pelanggan. Beberapa strategi efektif antara lain: bundle pairing (sarankan makanan pendamping untuk setiap minuman), upselling ukuran (tawarkan large daripada medium), dan add-on topping. Kenaikan ATV sebesar 15–20% tanpa biaya akuisisi tambahan akan langsung meningkatkan profitabilitas.',
      'Pantau ATV secara konsisten dan bandingkan per shift, per kasir, dan per hari. Jika ATV di shift sore lebih tinggi dari shift pagi, analisis mengapa — mungkin menu sore lebih premium atau kasir sore lebih aktif menawarkan produk tambahan. Insight ini kemudian bisa direplikasi ke shift lain untuk meningkatkan performa keseluruhan.',
    ],
  },
  {
    id: 8,
    image: '/materi/8.png',
    title: 'Revenue Per Kursi (Revenue Per Cover)',
    category: 'Unit Economics',
    paragraphs: [
      'Revenue Per Cover mengukur seberapa efisien Anda mengmonetisasi setiap kursi yang tersedia di cafe. Ini dihitung dengan membagi total revenue dengan jumlah "cover" — yaitu jumlah tamu yang dilayani dalam periode tertentu. Metrik ini sangat relevan untuk cafe dengan kapasitas duduk terbatas yang ingin memaksimalkan pendapatan dari ruang yang ada.',
      'Untuk meningkatkan revenue per cover, ada dua pendekatan utama: meningkatkan nilai rata-rata belanja per tamu (lihat ATV), atau mengurangi waktu duduk tamu yang memesan sedikit sambil tetap memberikan pengalaman yang menyenangkan. Di jam sibuk, table turnover yang cepat lebih bernilai daripada tamu yang duduk lama dengan pesanan minimal.',
      'Analisis revenue per cover per jam membantu mengidentifikasi bottleneck. Jika pada jam 12–14 semua kursi terisi tapi revenue per cover rendah, mungkin ada masalah pada kecepatan layanan atau komposisi menu yang dipesan. Dengan data ini, Anda bisa membuat keputusan operasional yang tepat seperti memperkuat staffing di jam tertentu atau menyesuaikan menu.',
    ],
  },
  {
    id: 9,
    image: '/materi/9.png',
    title: 'Analisis Revenue Per Jam',
    category: 'Unit Economics',
    paragraphs: [
      'Analisis revenue per jam membagi pendapatan cafe berdasarkan jam operasional, sehingga Anda bisa mengidentifikasi "golden hours" — jam-jam di mana traffic dan revenue tertinggi. Informasi ini sangat berharga untuk pengambilan keputusan operasional seperti penjadwalan staff, stok bahan, dan strategi promosi yang tepat waktu.',
      'Pola revenue per jam biasanya membentuk kurva yang dapat diprediksi: lonjakan pagi (sarapan/kopi pagi), penurunan mid-morning, lonjakan siang (makan siang), penurunan sore, dan kadang lonjakan kecil petang. Memahami pola ini memungkinkan Anda untuk beroperasi lebih efisien — mengurangi staf di jam sepi dan memperkuat di jam sibuk.',
      'Gunakan analisis ini juga untuk merancang strategi promosi berbasis waktu. Happy hour di jam sepi bisa meningkatkan revenue di waktu yang biasanya terbengkalai. Flash deal eksklusif satu jam bisa menciptakan traffic burst yang terukur. Dengan data revenue per jam, setiap kampanye marketing bisa dirancang dengan timing yang tepat.',
    ],
  },
  {
    id: 10,
    image: '/materi/10.png',
    title: 'Meningkatkan Average Order Value',
    category: 'Unit Economics',
    paragraphs: [
      'Average Order Value (AOV) adalah nilai rata-rata setiap transaksi di cafe Anda. Meningkatkan AOV adalah salah satu cara paling efisien untuk menumbuhkan revenue karena tidak membutuhkan penambahan pelanggan baru — Anda cukup membuat setiap pelanggan yang sudah ada membelanjakan lebih banyak per kunjungan.',
      'Ada tiga teknik utama untuk meningkatkan AOV. Pertama, upselling yaitu menawarkan produk yang lebih mahal dari yang diminta pelanggan. Kedua, cross-selling yaitu merekomendasikan produk pelengkap — misalnya menawarkan croissant ketika pelanggan memesan kopi. Ketiga, bundling yaitu membuat paket kombo yang terasa lebih hemat namun meningkatkan total belanja.',
      'Latih staff Anda untuk secara aktif dan alami melakukan upselling dan cross-selling tanpa terasa memaksa. Script yang tepat seperti "Kopi latte-nya mau kami pasangkan dengan croissant butter kami yang baru, Kak?" jauh lebih efektif daripada sekadar memajang menu di kasir. Lakukan A/B testing pada berbagai pendekatan dan ukur dampaknya terhadap AOV secara rutin.',
    ],
  },
  {
    id: 11,
    image: '/materi/11.png',
    title: 'Harga Pokok Penjualan (HPP)',
    category: 'HPP & Menu',
    paragraphs: [
      'Harga Pokok Penjualan atau Cost of Goods Sold (COGS/HPP) adalah biaya langsung yang dikeluarkan untuk memproduksi setiap item menu yang terjual. HPP mencakup biaya bahan baku utama, bahan pendukung, dan kemasan. Memahami HPP adalah fondasi dari seluruh strategi pricing dan margin management di cafe Anda.',
      'Cara menghitung HPP per item sangat sederhana: jumlahkan biaya semua bahan yang digunakan untuk membuat satu porsi menu tersebut. Misalnya, untuk satu gelas kopi susu: espresso Rp 3.000 + susu Rp 4.000 + gula Rp 200 + cup & tutup Rp 800 = HPP Rp 8.000. Jika dijual Rp 25.000, maka food cost percentage adalah 32% — masih dalam batas sehat.',
      'Lakukan perhitungan HPP secara berkala karena harga bahan baku berfluktuasi. Kenaikan harga susu atau kopi sebesar 10% bisa menggerus margin secara signifikan jika tidak segera diantisipasi dengan penyesuaian harga jual atau efisiensi resep. Dokumentasikan HPP setiap menu dalam sebuah recipe costing sheet yang selalu diperbarui.',
    ],
  },
  {
    id: 12,
    image: '/materi/12.png',
    title: 'Manajemen Bahan Baku & Pemasok',
    category: 'HPP & Menu',
    paragraphs: [
      'Manajemen bahan baku yang baik dimulai dari memilih pemasok yang tepat dan membangun hubungan jangka panjang yang saling menguntungkan. Jangan hanya memilih pemasok berdasarkan harga termurah — pertimbangkan juga keandalan pasokan, konsistensi kualitas, dan fleksibilitas dalam kondisi darurat. Pemasok yang terpercaya adalah aset strategis bagi cafe Anda.',
      'Terapkan sistem minimum reorder point untuk setiap bahan baku utama. Ketika stok kopi turun di bawah batas minimal, sistem otomatis mengingatkan untuk melakukan pemesanan ulang. Ini mencegah kehabisan bahan baku di tengah jam sibuk yang bisa merusak pengalaman pelanggan dan kehilangan revenue secara langsung.',
      'Negosiasikan harga secara berkala dengan pemasok, terutama jika volume pembelian Anda meningkat. Kontrak pembelian jangka panjang dengan harga yang dikunci bisa melindungi Anda dari fluktuasi harga pasar, namun pastikan kontrak tersebut memiliki klausul penyesuaian yang adil jika terjadi kondisi force majeure. Diversifikasi pemasok untuk produk kritis juga penting sebagai backup.',
    ],
  },
  {
    id: 13,
    image: '/materi/13.png',
    title: 'Teknik Perhitungan Food Cost',
    category: 'HPP & Menu',
    paragraphs: [
      'Food Cost Percentage (FCP) adalah persentase HPP terhadap harga jual suatu menu. Rumusnya: FCP = (HPP per item / Harga Jual) × 100%. Standar industri cafe adalah FCP di angka 25–35%. Artinya, dari setiap Rp 100 yang Anda terima dari penjualan, Rp 25–35 digunakan untuk biaya bahan baku.',
      'Ada dua cara menghitung food cost: per item (untuk pricing individual menu) dan secara agregat (untuk memantau efisiensi keseluruhan). Food cost agregat dihitung dengan membagi total biaya bahan baku bulanan dengan total revenue bulanan. Bandingkan FCP aktual dengan FCP teoretis (berdasarkan recipe costing) — selisih yang besar mengindikasikan adanya waste, theft, atau kesalahan porsi.',
      'Waste atau pemborosan adalah musuh terbesar profitabilitas dalam bisnis F&B. Bahan baku yang terbuang karena expire, overproduction, atau kesalahan memasak langsung meningkatkan food cost tanpa menghasilkan revenue. Terapkan sistem First In First Out (FIFO) untuk manajemen stok, lakukan prep harian yang terukur sesuai prediksi permintaan, dan pantau food waste report setiap hari.',
    ],
  },
  {
    id: 14,
    image: '/materi/14.png',
    title: 'Mendesain Menu Bermargin Tinggi',
    category: 'HPP & Menu',
    paragraphs: [
      'Desain menu yang strategis bisa meningkatkan profitabilitas cafe tanpa perlu menambah pelanggan. Konsep Menu Engineering membagi semua item menu ke dalam empat kategori berdasarkan popularitas dan profitabilitas: Stars (laku dan untung), Plowhorses (laku tapi margin tipis), Puzzles (margin tinggi tapi kurang laku), dan Dogs (tidak laku dan tidak untung). Setiap kategori membutuhkan strategi berbeda.',
      'Stars harus dipromosikan secara aktif dan dijaga kualitasnya — ini adalah "senjata utama" cafe Anda. Plowhorses perlu dievaluasi apakah bisa dinaikkan harganya atau dikurangi HPP-nya tanpa mengubah kualitas. Puzzles butuh promosi dan visibilitas lebih agar pelanggan mau mencoba. Dogs sebaiknya dihapus dari menu atau dikonsepkan ulang agar tidak membebani operasional.',
      'Tata letak menu (menu layout) juga mempengaruhi keputusan pembelian. Letakkan item dengan margin tertinggi di posisi yang paling mudah dilihat — sudut kanan atas atau bagian pertama dari menu adalah area yang paling sering dilihat pertama kali. Gunakan deskripsi yang menggugah selera untuk produk unggulan, dan hindari menonjolkan harga secara berlebihan agar pelanggan fokus pada nilai, bukan biaya.',
    ],
  },
  {
    id: 15,
    image: '/materi/15.png',
    title: 'Pengendalian Waste & Pemborosan',
    category: 'HPP & Menu',
    paragraphs: [
      'Pemborosan atau waste adalah salah satu kebocoran profit yang paling sering tidak disadari oleh pemilik cafe. Waste terjadi dalam berbagai bentuk: bahan baku yang expire sebelum dipakai, overproduction yang tidak terjual habis, kesalahan dalam proses memasak, dan porsi yang tidak konsisten. Total waste yang terakumulasi bisa menggerus profit secara signifikan.',
      'Implementasikan sistem tracking waste yang sederhana namun konsisten. Setiap hari, catat semua bahan yang dibuang beserta alasannya — expired, overcooked, jatuh, atau tidak laku. Data ini akan menunjukkan pola waste yang bisa dicegah. Misalnya, jika croissant selalu tersisa di akhir hari, kurangi jumlah produksi atau ubah strategi pricing di sore hari.',
      'Standarisasi resep adalah kunci pengendalian waste jangka panjang. Ketika setiap barista dan koki menggunakan takaran yang sama persis, konsistensi porsi terjaga dan biaya per item bisa diprediksi dengan akurat. Gunakan timbangan digital, measuring cups, dan jigger untuk memastikan setiap sajian sesuai standar — ini bukan hanya soal cost control, tapi juga kualitas produk yang konsisten.',
    ],
  },
  {
    id: 16,
    image: '/materi/16.png',
    title: 'Profitabilitas Per Item Menu',
    category: 'HPP & Menu',
    paragraphs: [
      'Tidak semua item di menu Anda menghasilkan keuntungan yang sama. Analisis profitabilitas per item memungkinkan Anda mengetahui persis mana produk yang paling berkontribusi pada bottom line dan mana yang hanya menghabiskan resources tanpa hasil yang sepadan. Tanpa analisis ini, Anda mungkin tanpa sadar mempromosikan produk yang justru menguras margin.',
      'Hitung kontribusi margin setiap item: Contribution Margin = Harga Jual – HPP. Ini adalah keuntungan kotor yang tersisa setelah menutup biaya bahan baku. Kalikan contribution margin dengan volume penjualan untuk mendapatkan total kontribusi profit setiap item. Item dengan contribution margin tinggi dan volume tinggi adalah yang paling berharga bagi bisnis Anda.',
      'Gunakan hasil analisis ini untuk keputusan strategis: pertahankan dan promosikan item dengan kontribusi tertinggi, evaluasi item yang kontribusinya rendah apakah layak dipertahankan di menu, dan pertimbangkan untuk menyederhanakan menu agar operasional lebih efisien. Menu yang lebih kecil namun teroptimasi seringkali lebih menguntungkan daripada menu yang besar namun membebani dapur.',
    ],
  },
  {
    id: 17,
    image: '/materi/17.png',
    title: 'Manajemen Biaya Tenaga Kerja',
    category: 'Biaya Operasional',
    paragraphs: [
      'Biaya tenaga kerja adalah salah satu komponen biaya terbesar dalam operasional cafe, biasanya berkisar 25–35% dari total revenue. Biaya ini mencakup gaji pokok, tunjangan, BPJS, lembur, dan biaya rekrutmen-training untuk karyawan baru. Mengelola biaya tenaga kerja dengan efektif bukan berarti membayar karyawan sekecil mungkin — melainkan memastikan setiap jam kerja menghasilkan output yang optimal.',
      'Hitung Labor Cost Percentage (LCP) secara rutin: LCP = Total Biaya Tenaga Kerja / Total Revenue × 100%. Jika LCP secara konsisten di atas 35%, itu sinyal bahwa ada inefisiensi dalam penjadwalan atau produktivitas. Analisis per shift untuk menemukan di mana inefisiensi terjadi — apakah ada shift yang terlalu banyak staf dibandingkan dengan traffic pelanggan?',
      'Investasi dalam pelatihan karyawan yang tepat dapat mengurangi biaya tenaga kerja dalam jangka panjang. Karyawan yang terlatih bekerja lebih cepat, membuat lebih sedikit kesalahan, dan menghasilkan lebih sedikit waste. Turnover karyawan yang tinggi juga merupakan biaya tersembunyi yang besar — biaya rekrutmen, onboarding, dan masa adaptasi bisa setara dengan beberapa bulan gaji.',
    ],
  },
  {
    id: 18,
    image: '/materi/18.png',
    title: 'Penjadwalan Shift yang Efisien',
    category: 'Biaya Operasional',
    paragraphs: [
      'Penjadwalan shift yang efisien berarti mencocokkan jumlah karyawan yang bekerja dengan volume traffic pelanggan yang diprediksi. Terlalu banyak staf di jam sepi berarti biaya tenaga kerja yang terbuang, sementara kekurangan staf di jam sibuk berarti pelayanan yang buruk dan kehilangan revenue. Data historis penjualan per jam adalah panduan terbaik untuk merancang jadwal yang optimal.',
      'Gunakan data penjualan 4–8 minggu terakhir untuk mengidentifikasi pola traffic. Biasanya terdapat pola yang konsisten: hari Senin biasanya lebih sepi dari Jumat, jam 12–13 selalu padat, dan bulan puasa memiliki pola yang berbeda dari bulan biasa. Dengan pola ini, buat jadwal "template" per hari dalam seminggu yang bisa disesuaikan setiap minggunya.',
      'Pertimbangkan fleksibilitas dalam jadwal shift. Karyawan part-time dan on-call bisa menjadi solusi untuk mengisi kebutuhan di jam puncak tanpa membebani payroll di jam sepi. Sistem shift split (masuk pagi, istirahat siang, kembali sore) bisa efisien di jam tertentu, namun pastikan ini tidak mempengaruhi kesejahteraan dan morale karyawan.',
    ],
  },
  {
    id: 19,
    image: '/materi/19.png',
    title: 'Mengukur Produktivitas Staff',
    category: 'Biaya Operasional',
    paragraphs: [
      'Produktivitas staff bisa diukur melalui beberapa metrik kuantitatif. Revenue Per Labor Hour (RPLH) adalah salah satu yang paling informatif — dihitung dengan membagi total revenue dengan total jam kerja dalam periode yang sama. Semakin tinggi RPLH, semakin produktif tim Anda secara keseluruhan. Bandingkan RPLH antar shift dan antar periode untuk mengidentifikasi tren.',
      'Selain metrik finansial, ukur juga kecepatan layanan (average service time per customer), tingkat kesalahan pesanan, dan kepuasan pelanggan. Staff yang bekerja cepat tapi banyak membuat kesalahan tidak lebih produktif dari staff yang lebih lambat namun akurat. Produktivitas sejati adalah kombinasi kecepatan, akurasi, dan kualitas layanan.',
      'Hasil pengukuran produktivitas harus dikomunikasikan secara transparan kepada tim dalam suasana yang supportif, bukan menghakimi. Gunakan data ini sebagai alat coaching, bukan hanya evaluasi. Staff yang tahu bagaimana performa mereka diukur dan diberikan feedback konstruktif cenderung memiliki motivasi lebih tinggi dan performa yang terus meningkat.',
    ],
  },
  {
    id: 20,
    image: '/materi/20.png',
    title: 'Sistem Insentif & Remunerasi',
    category: 'Biaya Operasional',
    paragraphs: [
      'Sistem insentif yang dirancang dengan baik adalah investasi, bukan sekadar biaya tambahan. Ketika karyawan memiliki target yang jelas dan reward yang sepadan, motivasi mereka meningkat dan hasilnya terlihat langsung pada performa penjualan. Sistem insentif juga membantu mengurangi turnover, karena karyawan yang merasa dihargai cenderung bertahan lebih lama.',
      'Desain insentif yang efektif harus terukur, achievable, dan relevan. Contoh: bonus per bulan untuk barista yang mencapai upselling rate di atas 30%, atau insentif bulanan untuk shift team yang mempertahankan rating kepuasan pelanggan di atas 4.5. Pastikan target tidak terlalu mudah (tidak memotivasi) maupun terlalu sulit (membuat frustasi dan resign).',
      'Insentif tidak harus selalu berupa uang. Recognition program seperti "Staff of the Month" dengan privilege tertentu, kesempatan pelatihan tambahan, atau fleksibilitas jadwal bisa menjadi motivator yang kuat, terutama untuk generasi muda. Kombinasikan insentif finansial dan non-finansial untuk membangun budaya kerja yang positif dan produktif.',
    ],
  },
  {
    id: 21,
    image: '/materi/21.png',
    title: 'Mengendalikan Biaya Operasional',
    category: 'Biaya Operasional',
    paragraphs: [
      'Biaya operasional mencakup semua pengeluaran di luar bahan baku dan tenaga kerja — sewa, listrik, air, internet, kebersihan, marketing, dan lain-lain. Meski masing-masing terlihat kecil, totalnya bisa mencapai 15–25% dari revenue. Mengontrol biaya operasional dengan cermat adalah cara efektif meningkatkan profit tanpa harus menaikkan harga atau menambah pelanggan.',
      'Lakukan audit biaya operasional setiap kuartal. Tinjau setiap item pengeluaran dan tanyakan: "Apakah ini masih relevan? Apakah ada alternatif yang lebih hemat dengan kualitas yang sama?" Seringkali ada langganan software atau layanan yang sudah tidak digunakan, atau kontrak dengan vendor yang bisa dinegosiasikan ulang dengan harga lebih baik.',
      'Efisiensi energi adalah area yang sering diabaikan namun berdampak signifikan. Matikan peralatan yang tidak digunakan di luar jam operasional, gunakan lampu LED, dan pertimbangkan audit energi profesional jika tagihan listrik menjadi beban besar. Di beberapa cafe, penghematan listrik bisa mencapai 15–20% hanya dengan perubahan kebiasaan operasional yang sederhana.',
    ],
  },
  {
    id: 22,
    image: '/materi/22.png',
    title: 'Manajemen Arus Kas (Cashflow)',
    category: 'Cashflow',
    paragraphs: [
      'Cashflow atau arus kas adalah pergerakan uang yang masuk dan keluar dari bisnis cafe Anda dalam periode tertentu. Sebuah cafe bisa memiliki profit yang bagus di atas kertas namun tetap mengalami kesulitan keuangan jika arus kasnya buruk — misalnya ketika tagihan besar jatuh tempo di saat pendapatan sedang rendah. "Cash is king" adalah prinsip yang sangat nyata dalam bisnis F&B.',
      'Buat cash flow projection minimal 3 bulan ke depan. Identifikasi semua pengeluaran besar yang sudah terjadwal — pembayaran sewa, cicilan peralatan, pembayaran ke pemasok — dan pastikan ada cukup kas tersedia saat jatuh tempo. Jika proyeksi menunjukkan defisit, Anda punya waktu untuk mencari solusi seperti menegosiasikan pembayaran bertahap atau meningkatkan penjualan di periode sebelumnya.',
      'Jaga selalu saldo kas minimum yang cukup untuk menutup biaya operasional 1–2 bulan ke depan tanpa bergantung pada penjualan hari itu. Ini adalah "safety net" finansial yang melindungi bisnis dari kejutan tak terduga seperti penurunan traffic mendadak, perbaikan peralatan darurat, atau pandemi. Dana cadangan ini bukan pemborosan — ini adalah asuransi kelangsungan bisnis.',
    ],
  },
  {
    id: 23,
    image: '/materi/23.png',
    title: 'Perencanaan Modal Kerja',
    category: 'Cashflow',
    paragraphs: [
      'Modal kerja (working capital) adalah uang yang dibutuhkan untuk menjalankan operasional cafe sehari-hari. Ini mencakup dana untuk pembelian bahan baku, pembayaran gaji sebelum revenue masuk, dan biaya operasional rutin lainnya. Modal kerja yang cukup memastikan operasional berjalan lancar tanpa gangguan akibat kekurangan dana.',
      'Hitung kebutuhan modal kerja dengan menjumlahkan semua pengeluaran operasional dalam satu siklus bisnis — biasanya 30 hari. Ini adalah jumlah minimum kas yang harus tersedia sebelum bisnis dimulai atau sebelum ekspansi dilakukan. Mengoperasikan cafe dengan modal kerja yang terlalu tipis adalah resep untuk stress dan pengambilan keputusan darurat yang sering kali mahal.',
      'Sumber modal kerja bisa berasal dari laba ditahan (reinvestasi profit), pinjaman bank jangka pendek, atau kredit dari pemasok (membayar 30 hari setelah pembelian). Kelola sumber modal kerja dengan bijak — jangan mengandalkan hutang jangka pendek untuk biaya yang sebenarnya bisa ditutup oleh cashflow operasional yang dioptimalkan.',
    ],
  },
  {
    id: 24,
    image: '/materi/24.png',
    title: 'Mengelola Piutang & Hutang',
    category: 'Cashflow',
    paragraphs: [
      'Di bisnis cafe retail, piutang jarang terjadi karena pembayaran bersifat tunai atau langsung. Namun piutang bisa muncul dari kerja sama katering, event, atau korporat yang membayar di akhir bulan. Piutang yang tidak ditagih tepat waktu mengikat kas yang seharusnya bisa diputar kembali untuk operasional.',
      'Di sisi hutang, cafe biasanya memiliki kewajiban kepada pemasok bahan baku, pemilik tempat (sewa), bank (cicilan), dan mungkin investor. Kelola jadwal pembayaran hutang dengan cermat agar tidak ada pembayaran yang terlewat. Keterlambatan pembayaran ke pemasok bisa merusak hubungan dan mengakibatkan penghentian pasokan, sementara keterlambatan cicilan bank meningkatkan biaya bunga.',
      'Negosiasikan term pembayaran yang menguntungkan cashflow Anda. Usahakan mendapat kredit dari pemasok selama 30–45 hari, sementara Anda menerima pembayaran tunai dari pelanggan setiap hari. Gap positif antara penerimaan dan pembayaran ini adalah "cashflow cushion" yang berharga. Semakin panjang waktu pembayaran ke pemasok, semakin banyak fleksibilitas keuangan yang Anda miliki.',
    ],
  },
  {
    id: 25,
    image: '/materi/25.png',
    title: 'Dana Cadangan & Manajemen Risiko Keuangan',
    category: 'Cashflow',
    paragraphs: [
      'Dana cadangan atau emergency fund adalah uang yang disisihkan khusus untuk menghadapi kondisi tidak terduga. Bagi cafe, ini bisa berupa perbaikan mendadak mesin espresso yang rusak, penurunan traffic akibat cuaca ekstrem, atau biaya tak terduga lainnya. Idealnya, dana cadangan mencakup biaya operasional selama 2–3 bulan.',
      'Bangun dana cadangan secara bertahap dengan menyisihkan persentase tertentu dari profit setiap bulan — misalnya 10–15%. Meski terasa lambat di awal, konsistensi selama beberapa bulan akan membangun bantalan finansial yang solid. Simpan dana cadangan di rekening terpisah dari rekening operasional agar tidak tergoda untuk menggunakannya untuk keperluan sehari-hari.',
      'Manajemen risiko keuangan juga mencakup diversifikasi sumber pendapatan. Cafe yang mengandalkan 100% pendapatannya dari penjualan di tempat rentan terhadap berbagai risiko — cuaca buruk, renovasi jalan, atau pandemi. Tambahkan channel pendapatan seperti delivery, catering, subscription coffee, atau penjualan merchandise untuk memitigasi risiko konsentrasi.',
    ],
  },
  {
    id: 26,
    image: '/materi/26.png',
    title: 'Rekonsiliasi Kas Harian',
    category: 'Cashflow',
    paragraphs: [
      'Rekonsiliasi kas harian adalah proses mencocokkan uang fisik di laci kasir dengan catatan transaksi di sistem POS. Ini adalah kontrol finansial paling dasar namun sangat penting — dilakukan setiap akhir shift atau akhir hari. Selisih yang tidak bisa dijelaskan antara kas fisik dan catatan sistem adalah red flag yang harus segera diselidiki.',
      'Prosedur rekonsiliasi yang baik mencakup: menghitung uang tunai, mencocokkan dengan struk POS, mencatat transaksi kartu dan digital wallet, dan mendokumentasikan semua void, refund, dan diskon. Setiap perbedaan, sekecil apapun, harus dicatat dan dilacak. Pola selisih berulang bisa mengindikasikan kesalahan sistem atau, lebih serius, kecurangan.',
      'Delegasikan rekonsiliasi kepada orang yang berbeda dari yang mengelola kas sepanjang hari — ini adalah prinsip "separation of duties" yang fundamental dalam kontrol internal. Setelah rekonsiliasi, lakukan cash deposit ke bank secara rutin untuk meminimalkan uang kas yang tersimpan di tempat usaha, yang merupakan risiko keamanan.',
    ],
  },
  {
    id: 27,
    image: '/materi/27.png',
    title: 'Strategi Penetapan Harga Menu',
    category: 'Harga & Promosi',
    paragraphs: [
      'Penetapan harga menu adalah keputusan bisnis yang paling berdampak langsung pada profitabilitas cafe. Harga yang terlalu rendah menggerus margin, sementara harga yang terlalu tinggi mengurangi volume penjualan. Kunci adalah menemukan titik harga yang memaksimalkan profitabilitas total — bukan harga tertinggi yang bisa Anda charge, melainkan harga yang paling mengoptimalkan kombinasi volume dan margin.',
      'Ada beberapa pendekatan penetapan harga yang bisa digunakan. Cost-plus pricing menetapkan harga berdasarkan HPP ditambah target margin — sederhana namun mengabaikan faktor pasar. Value-based pricing menetapkan harga berdasarkan nilai yang dirasakan pelanggan — lebih kompleks namun potensial menghasilkan margin lebih tinggi. Competitive pricing menggunakan harga kompetitor sebagai referensi.',
      'Jangan takut untuk menaikkan harga jika kualitas produk dan pengalaman pelanggan memang mendukung. Kenaikan harga 10–15% yang dikomunikasikan dengan baik dan diiringi peningkatan kualitas seringkali tidak mengurangi volume penjualan secara signifikan. Pelanggan yang loyal dan yang datang karena kualitas, bukan sekadar harga murah, adalah aset bisnis yang lebih berharga.',
    ],
  },
  {
    id: 28,
    image: '/materi/28.png',
    title: 'Psikologi Harga dalam F&B',
    category: 'Harga & Promosi',
    paragraphs: [
      'Psikologi harga mempelajari bagaimana persepsi pelanggan terhadap harga mempengaruhi keputusan pembelian mereka. Memahami psikologi ini memungkinkan cafe owner untuk menetapkan harga yang terasa "lebih hemat" atau "lebih premium" tanpa benar-benar mengubah nilai absolutnya secara drastis. Ini adalah seni sekaligus ilmu dalam bisnis F&B.',
      'Beberapa teknik psikologi harga yang terbukti efektif: Charm pricing (Rp 49.000 terasa jauh lebih murah dari Rp 50.000 meski selisihnya kecil), Anchoring (tampilkan produk mahal di menu untuk membuat produk menengah terasa wajar), Price bundling (paket kombo terasa lebih hemat dari item individu meski total nilainya sama), dan menghilangkan simbol mata uang di menu untuk mengurangi "rasa sakit" membeli.',
      'Tampilan dan layout menu secara langsung mempengaruhi perilaku pembelian. Menu tanpa tanda harga membuat pelanggan fokus pada item, bukan biaya. Deskripsi yang menggugah selera ("espresso segar dari single origin Flores") meningkatkan persepsi nilai dan mendukung harga premium. Foto berkualitas tinggi untuk produk unggulan secara konsisten meningkatkan penjualan item tersebut.',
    ],
  },
  {
    id: 29,
    image: '/materi/29.png',
    title: 'Merancang Promosi yang Menguntungkan',
    category: 'Harga & Promosi',
    paragraphs: [
      'Promosi yang baik bukan sekadar diskon — promosi yang baik dirancang untuk mencapai tujuan bisnis yang spesifik dan terukur: meningkatkan traffic di jam sepi, menghabiskan stok yang akan expire, memperkenalkan menu baru, atau memenangkan kembali pelanggan yang sudah lama tidak datang. Setiap promosi harus memiliki objektif yang jelas sebelum diluncurkan.',
      'Hitung profitabilitas promosi sebelum menjalankannya. Misalnya, promosi "Beli 2 Gratis 1" pada kopi artinya Anda menjual 3 kopi dengan harga 2. Jika HPP satu kopi adalah Rp 8.000 dan harga jual Rp 30.000, maka revenue per 3 kopi = Rp 60.000, sementara HPP = Rp 24.000, margin tetap Rp 36.000. Bandingkan dengan scenario tanpa promosi: 2 kopi × Rp 30.000 = Rp 60.000, HPP Rp 16.000, margin Rp 44.000. Promosi ini justru mengurangi margin!',
      'Alternatif promosi yang lebih menguntungkan: tambahkan value tanpa mengurangi harga (free upgrade size, free topping, free pastry mini), atau targetkan produk dengan HPP rendah untuk promosi diskon. Happy hour di jam sepi dengan diskon 20% lebih menguntungkan daripada diskon di jam sibuk karena menambah traffic baru, bukan mengurangi harga pelanggan yang sudah pasti datang.',
    ],
  },
  {
    id: 30,
    image: '/materi/30.png',
    title: 'Mengukur Efektivitas Promosi',
    category: 'Harga & Promosi',
    paragraphs: [
      'Setiap promosi yang dijalankan harus diukur dampaknya secara kuantitatif. Metrik yang perlu dipantau antara lain: peningkatan volume transaksi selama periode promosi vs periode yang sama sebelumnya, perubahan rata-rata nilai transaksi, dampak terhadap total revenue dan margin, serta berapa banyak pelanggan baru yang tertarik vs pelanggan lama yang hanya "mengambil keuntungan" dari diskon.',
      'Bandingkan revenue dan profit selama periode promosi dengan baseline (periode tanpa promosi). Jika promosi meningkatkan volume transaksi 40% namun margin turun 15%, hitung apakah total profit absolut tetap lebih tinggi. Seringkali promosi yang terlihat berhasil dari sisi traffic justru merugikan secara profitabilitas karena tidak mempertimbangkan elastisitas harga yang sesungguhnya.',
      'Lakukan post-promotion analysis untuk setiap kampanye dan dokumentasikan hasilnya. Data ini adalah pembelajaran berharga untuk merancang promosi yang lebih efektif di masa depan. Promosi yang tidak efektif harus dihentikan atau dimodifikasi, sementara promosi yang terbukti berhasil bisa dijadikan standar dan diulang secara berkala.',
    ],
  },
]

export default function ModulCafeMargin() {
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MODULES
    return MODULES.filter(m =>
      m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    )
  }, [search])

  if (selectedId !== null) {
    const idx = MODULES.findIndex(m => m.id === selectedId)
    const mod = MODULES[idx]
    const prev = idx > 0 ? MODULES[idx - 1] : null
    const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null
    return (
      <AppLayout title={mod.title}>
        <DetailView
          mod={mod}
          onBack={() => setSelectedId(null)}
          onPrev={prev ? () => setSelectedId(prev.id) : null}
          onNext={next ? () => setSelectedId(next.id) : null}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Modul CafeMargin">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900">Modul CafeMargin</h1>
              <p className="text-brand-400 text-sm">{MODULES.length} modul pembelajaran bisnis cafe</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari modul..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full max-w-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-brand-400 text-sm">Tidak ada modul yang cocok.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(mod => (
              <button
                key={mod.id}
                onClick={() => setSelectedId(mod.id)}
                className="group text-left bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all duration-150"
              >
                <div className="aspect-square overflow-hidden bg-brand-50">
                  <img
                    src={mod.image}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1 ${CAT_COLOR[mod.category] || 'bg-gray-100 text-gray-700'}`}>
                    {mod.category}
                  </span>
                  <p className="text-xs font-semibold text-brand-800 leading-snug line-clamp-2">
                    {mod.id}. {mod.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function DetailView({ mod, onBack, onPrev, onNext }) {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-brand-500 hover:text-brand-800 text-sm font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar modul
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <img
          src={mod.image}
          alt={mod.title}
          className="w-full object-contain bg-brand-50"
          style={{ maxHeight: '480px' }}
        />

        <div className="p-5 sm:p-6">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${CAT_COLOR[mod.category] || 'bg-gray-100 text-gray-700'}`}>
            {mod.category}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-brand-900 mb-4">
            Modul {mod.id} — {mod.title}
          </h2>

          <div className="space-y-4">
            {mod.paragraphs.map((p, i) => (
              <p key={i} className="text-brand-700 text-sm sm:text-base leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-200 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Modul Sebelumnya
        </button>
        <span className="text-xs text-brand-400 font-medium">
          {mod.id} / {MODULES.length}
        </span>
        <button
          onClick={onNext}
          disabled={!onNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-200 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Modul Berikutnya <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
