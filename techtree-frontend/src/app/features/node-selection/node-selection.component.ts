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
  levelError = '';
  searchTerm = '';
  readonly maxSelectable = 12;
  exporting = false;
  categoryFilter = 'all';
  levelFilter: 'all' | '0' | '1' | '2' | '3' | '4' | '5' = 'all';
  showSelectedOnly = false;
  levelSavingIds = new Set<number>();
  savingSelections = false;
  selectionSaveQueued = false;

  constructor(private apiService: TechTreeApiService, private router: Router) { }

  async ngOnInit() {
    await this.loadSkills();
    await this.loadCardSelections();
    this.applyFilters();
  }

  async loadSkills() {
    this.loading = true;
    this.error = '';
    try {
      const skills = await this.apiService.fetchSkills();
      this.skills = (skills ?? []).map((skill) => ({ ...skill, level: skill.level ?? 0 }));
      this.sortSkills();
    } catch (err) {
      console.error('Failed to load skills', err);
      this.error = 'ノードの取得に失敗しました。時間をおいて再度お試しください。';
    } finally {
      this.loading = false;
    }
  }

  async loadCardSelections() {
    try {
      const selections = await this.apiService.fetchCardSelections();
      const availableIds = new Set(this.skills.map((s) => s.id));
      const orderedIds = selections
        .filter((selection) => availableIds.has(selection.node_id))
        .sort((a, b) => {
          if (a.position === b.position) {
            return a.id - b.id;
          }
          return a.position - b.position;
        })
        .map((selection) => selection.node_id);

      this.selectedSkillOrder = orderedIds;
      this.selectedSkillIds = new Set(orderedIds);
      this.reconcileSelectedOrder();
    } catch (err) {
      console.error('Failed to load saved selections', err);
      this.selectionError = '保存済みのカード選択を読み込めませんでした。';
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
    this.levelError = '';
    if (this.selectedSkillIds.has(skill.id)) {
      this.selectedSkillIds.delete(skill.id);
      this.selectedSkillOrder = this.selectedSkillOrder.filter((id) => id !== skill.id);
      this.applyFilters();
      void this.persistSelections();
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
    this.applyFilters();
    void this.persistSelections();
  }

  applySearch(term: string) {
    this.searchTerm = term;
    this.applyFilters();
  }

  setCategoryFilter(value: string) {
    this.categoryFilter = value;
    this.applyFilters();
  }

  setLevelFilter(value: string) {
    const allowed: Array<'all' | '0' | '1' | '2' | '3' | '4' | '5'> = ['all', '0', '1', '2', '3', '4', '5'];
    this.levelFilter = allowed.includes(value as any) ? (value as any) : 'all';
    this.applyFilters();
  }

  toggleShowSelected(checked: boolean) {
    this.showSelectedOnly = checked;
    this.applyFilters();
  }

  applyFilters() {
    const keyword = this.searchTerm.trim().toLowerCase();
    const minLevel = this.levelFilter === 'all' ? 0 : Number(this.levelFilter);
    const selectedOnly = this.showSelectedOnly;
    const category = this.categoryFilter;

    this.filteredSkills = this.skills.filter((skill) => {
      const target = `${this.displayName(skill)} ${skill.category ?? ''}`.toLowerCase();
      const matchesSearch = keyword ? target.includes(keyword) : true;
      const normalizedCategory = (skill.category ?? '').trim() || '未分類';
      const matchesCategory = category === 'all' ? true : normalizedCategory === category;
      const matchesLevel = (skill.level ?? 0) >= minLevel; // Lv0 も対象
      const matchesSelection = selectedOnly ? this.isSelected(skill) : true;
      return matchesSearch && matchesCategory && matchesLevel && matchesSelection;
    });
  }

  get categoryOptions(): string[] {
    const categories = new Set<string>();
    this.skills.forEach((skill) => {
      const normalized = (skill.category ?? '').trim() || '未分類';
      categories.add(normalized);
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'ja'));
  }

  clearSelection() {
    this.selectedSkillIds.clear();
    this.selectedSkillOrder = [];
    this.selectionError = '';
    this.applyFilters();
    void this.persistSelections();
  }

  backToGraph() {
    this.router.navigate(['/']);
  }

  async persistSelections() {
    if (this.savingSelections) {
      this.selectionSaveQueued = true;
      return;
    }
    this.savingSelections = true;
    this.selectionError = '';
    try {
      const payload = this.selectedSkills.map((skill, index) => ({
        node_id: skill.id,
        position: index,
      }));
      await this.apiService.saveCardSelections(payload);
    } catch (err) {
      console.error('Failed to save card selections', err);
      this.selectionError = 'カード選択の保存に失敗しました。';
    } finally {
      this.savingSelections = false;
      if (this.selectionSaveQueued) {
        this.selectionSaveQueued = false;
        void this.persistSelections();
      }
    }
  }

  async updateSkillLevel(skill: Skill, levelValue: number) {
    const normalizedLevel = Math.min(5, Math.max(0, Number(levelValue) || 0));
    const target = this.skills.find((s) => s.id === skill.id);
    if (!target || target.level === normalizedLevel) return;

    this.levelSavingIds.add(skill.id);
    this.levelError = '';
    try {
      await this.apiService.updateSkill(skill.id, { level: normalizedLevel });
      target.level = normalizedLevel;
      this.sortSkills();
    } catch (err) {
      console.error('Failed to update skill level', err);
      this.levelError = 'レベルの更新に失敗しました。時間をおいて再度お試しください。';
    } finally {
      this.levelSavingIds.delete(skill.id);
    }
  }

  onLevelInput(skill: Skill, value: string) {
    this.updateSkillLevel(skill, Number(value));
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
    void this.persistSelections();
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

  private sortSkills() {
    this.skills = [...this.skills].sort((a, b) => {
      if (b.level === a.level) {
        return (a.name ?? a.label ?? '').localeCompare(b.name ?? b.label ?? '', 'ja');
      }
      return (b.level ?? 0) - (a.level ?? 0);
    });
    this.applyFilters();
    this.reconcileSelectedOrder();
  }
}
