//Multi token input 
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MarkdownPreviewComponent } from '../markdown-preview/markdown-preview.component';
import Swal from 'sweetalert2';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, MarkdownPreviewComponent, CommonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent {
  token = signal('');
  owner = signal('');
  repoList = signal<{ id: number, name: string, path: string }[]>([]);
  selectedRepo = signal('');
  selectedRepoId = signal<number | null | any>(null);
  filesList = signal<{name: string; path: string}[]>([]);
  selectedFile = signal('');
  markdownContent = signal('');
  status = signal('');
  codeLanguage = '';
  codeContent = '';
  admonitionType = 'note';
  admonitionTitle = '';
  admonitionContent = '';
  jsxTabs: { label: string; value: string; content: string } [] = [
    { label: '', value: '', content: ''}
  ];
  defaultTabIndex: number = 0;
  filename = '';
  newMarkdownContent = '';
  showMenu = true;

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('markdownArea') markdownArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('markdownTextarea') markdownTextarea!: ElementRef<HTMLTextAreaElement>;


  triggerImageInput() {
    this.imageInput.nativeElement.click();
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner', this.owner());
    formData.append('repo', this.selectedRepoId());
    formData.append('token', this.token());

    console.log('Mengubah gambar...');

    this.http.post<{url: string}>('http://localhost:3001/upload-image', formData).subscribe({
      next: (res) => {
        const markdown = `![${file.name}](${res.url})`;

        const textarea = this.markdownArea.nativeElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = this.markdownContent().substring(0, start);
        const after = this.markdownContent().substring(end);
        this.markdownContent.set(before + markdown + after);

        Swal.fire({
          title: 'Success',
          text: 'Gambar berhasil diunggah dan disisipkan',
          icon: 'success',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        })

        input.value = '';
      },
      error: err => {
        console.error(err);

        Swal.fire({
          title: 'Gagal Upload Gambar',
          text: (`${err.message}`),
          icon: 'error',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        })

      }
    })
  }

  constructor(private http: HttpClient) {}

  loadRepos() {
    const ownerVal = this.owner();
    const tokenVal = this.token();

    if (!ownerVal || !tokenVal) {
      Swal.fire({
        title: 'Error',
        text: 'Token dan Username harus diisi',
        icon: 'error',
        confirmButtonText: 'Done',
        confirmButtonColor: '#346beb'
      })
      return
    }

    this.http.get<any[]>(`http://localhost:3001/repos?owner=${this.owner()}&token=${this.token()}`).subscribe({
      next: data => this.repoList.set(data),
      error(err: any) {
        Swal.fire({
          title: 'Gagal menghubungkan repositori',
          text: 'Periksa kembali Token dan Username',
          icon: 'error',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        })
        return
      },
    });
  }

  loadFiles() {
    this.http.get<any[]>(`http://localhost:3001/docs?owner=${this.owner()}&repo=${this.selectedRepoId()}&token=${this.token()}&path=docs`)
    .pipe(
      catchError(err => {
        console.error(err);

        Swal.fire({
          title: 'Gagal ambil isi repositori',
          text: `${err.message}`,
          icon: 'error',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        });

        return of([]);
      })
    )
    .subscribe(data => {
      this.filesList.set(data);
    })
  }

  loadFileContent() {

    const path = this.selectedFile();

    if (!path) return;

    const params = {
      token: this.token(),
      owner: this.owner(),
      repo: this.selectedRepoId(),
      path: path
    }

    this.http.get('http://localhost:3001/file', { 
      params: params as any, 
      responseType: 'text' as const 
    }).subscribe({
      next: (content) => {
        this.markdownContent.set(content);

        setTimeout(() => {
          this.markdownArea?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this.markdownArea?.nativeElement.focus();
        }, 200);
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.error || 'Gagal memuat file';
        Swal.fire('Gagal', detail, 'error')
      }
    })
  }

  saveFile() {
    const body = {
      token: this.token(),
      owner: this.owner(),
      repo: this.selectedRepoId(),
      path: this.selectedFile(),
      content: this.markdownContent(),
      message: `Update via CMS By : ${this.owner}`
    }

    this.http.post('http://localhost:3001/file', body).subscribe({
      next(res: any) {
        Swal.fire({
          title: 'Success',
          text: (`Perubahan Berhasil di commit : ${res.commit}`),
          icon: 'success',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        })
        return
      },
      error(err: any) {
        Swal.fire({
          title: 'Perubahan gagal di commit',
          text: (`${err.message}`),
          icon: 'error',
          confirmButtonText: 'Done',
          confirmButtonColor: '#346beb'
        })
        return
      },
    });
  }

  openSnippetModal() {
    const modalEl = document.getElementById('codeSnippetModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  insertCodeSnippet() {
    const textarea = this.markdownArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = this.markdownContent().substring(0, start);
    const after = this.markdownContent().substring(end);

    const snippet =  `\n\`\`\`${this.codeLanguage.trim()}\n${this.codeContent.trim()}\n\`\`\`\n`;

    this.markdownContent.set(before + snippet + after);

    this.codeLanguage = '';
    this.codeContent = '';

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    })
  }

  openAdmonitionModal() {
    const modalEl = document.getElementById('admonitionModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  insertAdmonition() {
    const textarea = this.markdownArea.nativeElement;
    const start = textarea.selectionStart;
    const end =textarea.selectionEnd;

    const before = this.markdownContent().substring(0, start);
    const after = this.markdownContent().substring(end);

    const titlePart = this.admonitionTitle.trim() ? ` ${this.admonitionTitle.trim()}` : '';
    const admonitionBlock = `\n:::${this.admonitionType}${titlePart}\n${this.admonitionContent.trim()}\n::::\n`;

    this.markdownContent.set(before + admonitionBlock + after);

    this.admonitionType = 'note';
    this.admonitionTitle = '';
    this.admonitionContent = '';
  }

  openTabsModal() {
    const modalEl = document.getElementById('tabsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  addTab() {
    this.jsxTabs.push({ label: '', value: '', content: ''});
  }

  insertJsxTabs() {
    const textarea = this.markdownArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = this.markdownContent().substring(0, start);
    const after = this.markdownContent().substring(end);

    const tabItems = this.jsxTabs.map((tab, i) => {
      const defaultAttr = i === this.defaultTabIndex ? ' default' : '';
      return ` <TabItem value="${tab.value.trim()}" label="${tab.label.trim()}"${defaultAttr}>
      ${tab.content.trim()}
      </TabItem>`;
    })
    .join('\n');

    const jsxBlock = `import Tabs from '@theme/Tabs'; \nimport TabItem from '@theme/TabItem';\n\n<Tabs>\n${tabItems}\n</Tabs>\n`;
    
    this.markdownContent.set(before + jsxBlock + after);
    this.jsxTabs = [{ label: '', value: '', content: '' }];
    this.defaultTabIndex = 0;

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + jsxBlock.length;
    })
  }

  applyFormatting(type: 'bold' | 'italic' | 'ul' | 'heading1' | 'heading2') {
    const textarea = this.markdownArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selected = this.markdownContent().substring(start, end);
    let formatted = selected;

    switch (type) {
      case 'bold':
      formatted = `**${selected}**`;
      break;

      case 'italic':
      formatted = `*${selected}*`;
      break;
      case 'ul':
      formatted = selected
      .split('\n')
      .map(line => line.startsWith('- ') ? line : `- ${line}`)
      .join('\n');
      break;

      case 'heading1':
      formatted = selected
      .split('\n')
      .map(line => `# ${line.replace(/^#+\s*/, '')}`)
      .join('\n');
      break;

      case 'heading2':
      formatted = selected
      .split('\n')
      .map(line => `## ${line.replace(/^#+\s*/, '')}`)
      .join('\n');
      break;
    }

    const before = this.markdownContent().substring(0, start);
    const after = this.markdownContent().substring(end);
    this.markdownContent.set(before + formatted + after);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = start + formatted.length;
    });
  }


  editFile(path: string) {
    this.selectedFile.set(path);
    this.loadFileContent();
  }


  addNewMarkdownFile() {
    if (!this.filename.endsWith('.md')) {
      Swal.fire('Error', 'Nama file harus di akhiri dengan .md', 'error');
      return;
    }

    const payload = {
      token: this.token(),
      owner: this.owner(),
      repo: this.selectedRepoId(),
      path: `docs/${this.filename}`,
      content: this.newMarkdownContent,
      message: `Add new file ${this.filename} via cms`
    };

    console.log('Payload :', payload )

    this.http.post('http://localhost:3001/new-file', payload).subscribe({
      next: () => {
        Swal.fire('Berhasil', 'File berhasil ditambahkan ke repositori', 'success');
        this.filename = '';
        this.newMarkdownContent = '';
        this.loadFiles();
      },
      error: (err) => {
        const detail = err.error?.detail || err.error?.error || 'Terjadi kesalahan';
        Swal.fire('Gagal', detail, 'error');
      }
    });
  }


  deleteFile(path: string) {
    const params : any = {
      token: this.token(),
      owner: this.owner(),
      repo: this.selectedRepoId(),
      path: path
    };

    Swal.fire({
      title: 'Warning',
      text: `File "${path}" akan dihapus permanen dari repository.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete('http://localhost:3001/delete-file', { params }).subscribe({
          next: () => {
            Swal.fire('Berhasil', 'File berhasil dihapus dari repository', 'success');
            this.loadFiles();
          },
          error: (err) => {
            const detail = err.error?.detail || err.error?.error || 'Terjadi kesalahan saat menghapus';
            Swal.fire('Gagal', detail, 'error');;
          }
        });
      }
    });
  }

  menuClick() {
    this.showMenu = !this.showMenu;
  }
}
