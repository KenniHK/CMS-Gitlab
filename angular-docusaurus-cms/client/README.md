# 🧩 Docusaurus CMS - Web-Based Markdown Editor for GitHub Docs

CMS berbasis web yang dibuat menggunakan **Angular** dan **Node.js (Express)** untuk mengelola dokumentasi berbasis **Docusaurus** yang tersebar di berbagai repositori GitHub. CMS ini memungkinkan pengguna untuk:

- Menelusuri dan memilih repositori GitHub
- Melihat dan mengedit file markdown (`.md`)
- Menambahkan file baru ke folder `docs/`
- Mengunggah gambar dan menyisipkannya ke markdown
- Menyisipkan kode, admonition, dan JSX Tabs
- Menyimpan perubahan langsung ke GitHub (commit)
- Menghapus file dari repositori

---

## 🚀 Fitur

### 🔍 Navigasi
- Autentikasi via Personal Access Token (PAT)
- Input username dan token GitHub
- Daftar semua repositori milik pengguna
- Menampilkan file `.md` dari direktori `docs/`

### 📄 Editor Markdown
- Editor berbasis `<textarea>` dengan preview
- Menyisipkan gambar (upload ke backend, dapatkan URL CDN)
- Menyisipkan block code, admonition, tab JSX
- Formatting tools: bold, italic, heading, bullet list
- Scroll otomatis ke editor saat mengedit file

### 📁 File Management
- Tambah file baru ke `docs/`
- Commit langsung ke GitHub
- Hapus file dari repositori dengan konfirmasi
- Menampilkan nama branch & commit ID terakhir (opsional)

---

## 🛠️ Instalasi

1. Clone repository 
2. Setup Backend (Node.js) :
- Arahkan menuju directory Backend (cd/angular-docusaurus-cms/server)
- Jalankan "npm install"
- Jalankan "node index.js"
- Server backend akan berjalan di port 3001
3. Setup Frontend (Angular) :
- Arahkan menuju directory Frontend (cd/angular-docusaurus-cms/client)
- Jalankan "npm install"
- Jalankan "ng serve"
- Frontend akan berjalan pada port 4200


# Cara Penggunaan

## 🔐 Autentikasi GitHub
CMS ini menggunakan GitHub Personal Access Token untuk otorisasi akses repositori pribadi dan publik.
Permission yang dibutuhkan:
repo (full control of private repositories)
Buat token dari git/github dengan izin akses untuk membaca dan menulis file kedalam repository ( izinkan semua akses "read & write" )

*Gunakan token dengan hati-hati. CMS ini tidak menyimpan token yang digunakan*


🧪 Contoh Penggunaan
1. Masukkan Username dan Personal Access Token yang sudah diberikan akses full untuk menulis dan membaca
2. Klik Load Repos
3. Pilih repositori yang ingin di edit → klik Load Files
4. List file md yang ada dalam repository akan di load kedalam tabel
5. User dapat menambahkan file markdown baru melalui field yang telah di sediakan
6. Klik tombol edit pada file .md untuk melakukan editing pada file yang dipilih
7. Edit konten markdown :
Text Format -> berisi beberapa opsi untuk mengubah format text yang ditampilkan didalam markdown (Bold, Italic, Heading, List)
Menu -> berisi fitur-fitur docusaurus yang bisa di masukkan kedalam file markdown ( Image, Snippet Code, Admonition, Tabs )
8. Delete konten markdown yang berada didalam repositori dengan menggunakan tombol delete
9. Simpan perubahan yang dilakukan dengan tombol Commit Changes -> Commit akan dilakukan langsung ke branch default

🧱 Teknologi yang Digunakan
🔹 Angular (Standalone Components)
🔸 Node.js + Express
🐙 Octokit (GitHub REST API)
🍬 SweetAlert2 (popup feedback)
🧱 Bootstrap (modal)
✍️ Markdown + JSX Docusaurus
