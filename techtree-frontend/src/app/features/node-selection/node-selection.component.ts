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
  selectedSkillOrder: number[] = [];
  draggingCardId: number | null = null;
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
        .sort((a, b) => {
          if (b.level === a.level) {
            return (a.name ?? a.label ?? '').localeCompare(b.name ?? b.label ?? '');
          }
          return (b.level ?? 0) - (a.level ?? 0);
        });
      this.filteredSkills = [...this.skills];
      this.reconcileSelectedOrder();
    } catch (err) {
      console.error('Failed to load skills', err);
      this.error = 'ノードの取得に失敗しました。時間をおいて再度お試しください。';
    } finally {
      this.loading = false;
    }
  }

  get selectedSkills(): Skill[] {
    const skillMap = new Map(this.skills.map((skill) => [skill.id, skill]));
    const ordered = this.selectedSkillOrder
      .map((id) => skillMap.get(id))
      .filter((skill): skill is Skill => Boolean(skill));
    const missing = this.skills.filter(
      (skill) => this.selectedSkillIds.has(skill.id) && !this.selectedSkillOrder.includes(skill.id)
    );
    return [...ordered, ...missing];
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
      this.selectedSkillOrder = this.selectedSkillOrder.filter((id) => id !== skill.id);
      return;
    }

    if (this.selectedSkillIds.size >= this.maxSelectable) {
      this.selectionError = `最大${this.maxSelectable}件まで選択できます。`;
      return;
    }

    this.selectedSkillIds.add(skill.id);
    if (!this.selectedSkillOrder.includes(skill.id)) {
      this.selectedSkillOrder = [...this.selectedSkillOrder, skill.id];
    }
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
    this.selectedSkillOrder = [];
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

  private reconcileSelectedOrder() {
    const availableIds = new Set(this.skills.map((s) => s.id));
    this.selectedSkillOrder = this.selectedSkillOrder.filter(
      (id) => availableIds.has(id) && this.selectedSkillIds.has(id)
    );
    this.selectedSkillIds = new Set(this.selectedSkillOrder);
  }

  onCardDragStart(skillId: number) {
    this.draggingCardId = skillId;
  }

  onCardDragEnter(targetId: number) {
    if (this.draggingCardId == null || this.draggingCardId === targetId) return;
    this.reorderSelectedSkills(this.draggingCardId, targetId);
  }

  onCardDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onCardDrop(event: DragEvent, targetId: number) {
    event.preventDefault();
    this.onCardDragEnter(targetId);
    this.draggingCardId = null;
  }

  onCardDragEnd() {
    this.draggingCardId = null;
  }

  private reorderSelectedSkills(sourceId: number, targetId: number) {
    const order = [...this.selectedSkillOrder];
    const fromIndex = order.indexOf(sourceId);
    const toIndex = order.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, sourceId);
    this.selectedSkillOrder = order;
  }
}
