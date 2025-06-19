import { Component, OnInit } from '@angular/core';
import { CmsService } from '../services/cms.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html'
})
export class EditorComponent implements OnInit {
  repos: string[] = [];
  files: { name: string, path: string }[] = [];

  selectedRepo: string = '';
  selectedFile: string = '';
  content: string = '';

  constructor(private cms: CmsService) {}

  ngOnInit(): void {
    this.loadRepos();
  }

  loadRepos(): void {
    this.cms.getRepos().subscribe(repos => {
      this.repos = repos.map(r => r.name);
    });
  }

  loadFiles(): void {
    if (!this.selectedRepo) return;
    this.cms.getDocs(this.selectedRepo).subscribe(files => {
      this.files = files;
    });
  }

  loadFile(): void {
    if (!this.selectedRepo || !this.selectedFile) return;
    this.cms.getFile(this.selectedRepo, this.selectedFile).subscribe(content => {
      this.content = content;
    });
  }

  save(): void {
    if (!this.selectedRepo || !this.selectedFile) return;
    this.cms.saveFile(this.selectedRepo, this.selectedFile, this.content, 'Update via CMS')
      .subscribe(() => alert('✅ File berhasil disimpan.'));
  }
}