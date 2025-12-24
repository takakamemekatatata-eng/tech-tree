import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TechTreeApiService } from '../../core/services/api/tech-tree-api.service';
import { Skill } from '../../core/models/skill.model';

@Component({
  selector: 'app-node-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './node-selection.component.html',
  styleUrls: ['./node-selection.component.css']
})
export class NodeSelectionComponent implements OnInit {
  @ViewChild('cardList') cardList?: ElementRef<HTMLDivElement>;

  skills: Skill[] = [];
  filteredSkills: Skill[] = [];
  selectedSkillIds = new Set<number>();
  loading = false;
  error = '';
  selectionError = '';
  exportError = '';
  searchTerm = '';
  readonly maxSelectable = 12;
  exporting = false;

  constructor(private apiService: TechTreeApiService, private router: Router) { }

  ngOnInit() {
    this.loadSkills();
  }

  async loadSkills() {
    this.loading = true;
    this.error = '';
    try {
      const skills = await this.apiService.fetchSkills();
      this.skills = (skills ?? [])
        .map((skill) => ({ ...skill, level: skill.level ?? 0 }))
        .filter((skill) => (skill.level ?? 0) >= 1)
        .sort((a, b) => {
          if (b.level === a.level) {
            return (a.name ?? a.label ?? '').localeCompare(b.name ?? b.label ?? '');
          }
          return (b.level ?? 0) - (a.level ?? 0);
        });
      this.filteredSkills = [...this.skills];
    } catch (err) {
      console.error('Failed to load skills', err);
      this.error = 'ノードの取得に失敗しました。時間をおいて再度お試しください。';
    } finally {
      this.loading = false;
    }
  }

  get selectedSkills(): Skill[] {
    return this.skills.filter((skill) => this.selectedSkillIds.has(skill.id));
  }

  displayName(skill: Skill) {
    return skill.name ?? skill.label ?? 'No name';
  }

  isSelected(skill: Skill) {
    return this.selectedSkillIds.has(skill.id);
  }

  toggleSelection(skill: Skill) {
    this.selectionError = '';
    if (this.selectedSkillIds.has(skill.id)) {
      this.selectedSkillIds.delete(skill.id);
      return;
    }

    if (this.selectedSkillIds.size >= this.maxSelectable) {
      this.selectionError = `最大${this.maxSelectable}件まで選択できます。`;
      return;
    }

    this.selectedSkillIds.add(skill.id);
  }

  applySearch(term: string) {
    this.searchTerm = term;
    const keyword = term.trim().toLowerCase();
    if (!keyword) {
      this.filteredSkills = [...this.skills];
      return;
    }

    this.filteredSkills = this.skills.filter((skill) => {
      const target = `${this.displayName(skill)} ${skill.category ?? ''}`.toLowerCase();
      return target.includes(keyword);
    });
  }

  clearSelection() {
    this.selectedSkillIds.clear();
    this.selectionError = '';
  }

  backToGraph() {
    this.router.navigate(['/']);
  }

  async downloadCardsPng() {
    if (!this.cardList || this.selectedSkillIds.size === 0) return;

    this.exporting = true;
    this.exportError = '';
    try {
      const dataUrl = await this.buildCardsPng(this.cardList.nativeElement);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'selected-nodes.png';
      link.click();
    } catch (err) {
      console.error('Failed to export cards', err);
      this.exportError = 'カード一覧のPNG出力に失敗しました。';
    } finally {
      this.exporting = false;
    }
  }

  private inlineStyles(source: Element, target: Element) {
    const sourceStyle = window.getComputedStyle(source);
    const targetEl = target as HTMLElement;
    targetEl.style.cssText = Array.from(sourceStyle)
      .map((prop) => `${prop}:${sourceStyle.getPropertyValue(prop)};`)
      .join('');

    Array.from(source.children).forEach((child, index) => {
      const targetChild = target.children.item(index);
      if (targetChild) {
        this.inlineStyles(child, targetChild);
      }
    });
  }

  private buildSvgDataUrl(element: HTMLElement, width: number, height: number) {
    const clone = element.cloneNode(true) as HTMLElement;
    this.inlineStyles(element, clone);

    const wrapper = document.createElement('div');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.padding = '0';
    wrapper.appendChild(clone);

    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.appendChild(wrapper);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.appendChild(foreignObject);

    const serialized = new XMLSerializer().serializeToString(svg);
    const encoded = encodeURIComponent(serialized);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  private svgToPng(dataUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported'));
          return;
        }
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  }

  private async buildCardsPng(element: HTMLElement) {
    const width = Math.ceil(element.scrollWidth || element.offsetWidth || 800);
    const height = Math.ceil(element.scrollHeight || element.offsetHeight || 600);
    const svgDataUrl = this.buildSvgDataUrl(element, width, height);
    return this.svgToPng(svgDataUrl, width, height);
  }
}
