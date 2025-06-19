import { Component, Input } from '@angular/core';
import { marked } from 'marked';

@Component({
    selector: 'app-markdown-preview',
    standalone: true,
    templateUrl: './markdown-preview.component.html'
})

export class MarkdownPreviewComponent {
    @Input() data: string = '';

    get renderedMarkdown() {
        return marked.parse(this.data || '');
    }
}