import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import axios from 'axios';
import { layoutConfig, levelNodeConfig, mainLabelConfig } from './visual-config';
import { environment } from '../environments/environment';

cytoscape.use(dagre);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  cy: any = null;
  selectedNode: any = null;
  searchTerm = '';
  levelMenuOpen = false;
  categoryMenuOpen = false;
  selectedLevels: Set<number> = new Set();
  selectedCategories: Set<string> = new Set();
  levelOptions: number[] = [];
  categoryOptions: string[] = [];
  categoryColors: Record<string, string> = {};
  categoryList: { id: number; name: string; color: string }[] = [];
  sidebarCollapsed = false;
  layoutName = 'dagre';
  //layoutName = 'breadthfirst';

  elements: any[] = []; // store node + edge elements until cy is initialized

  // table / view state
  viewMode: 'graph' | 'table' = 'graph';
  skills: any[] = [];
  filteredTableRows: any[] = [];
  sortState: {
    column: 'label' | 'category' | 'level' | 'user_comment' | 'description';
    direction: 'asc' | 'desc';
  } = {
    column: 'label',
    direction: 'asc'
  };

  editingMode = false;
  newSkill = {
    name: '',
    category: '',
    level: 0,
    description: '',
    parent_id: null as number | null,
    color: '#4a5568'
  };
  editingCategory = {
    name: '',
    color: '#4a5568'
  };

  // --------------------------
  // Centralized layout config
  // --------------------------
  // replaced inline definitions with imported configs
  readonly layoutConfig = layoutConfig;
  readonly levelNodeConfig = levelNodeConfig;
  readonly mainLabelConfig = mainLabelConfig;

  // inject ChangeDetectorRef and NgZone so Cytoscape callbacks can update Angular view
  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  // Helper: return layout options for a layout name
  getLayoutOptions(layoutName?: string) {
    const name = layoutName ?? this.layoutName;
    // Use `any` to avoid typing issues with cytoscape layout typed options
    return (this.layoutConfig as any)[name] ?? (this.layoutConfig as any).dagre;
  }

  async ngOnInit() {
    try {
      const [categoryRes, skillRes] = await Promise.all([
        axios.get(`${environment.apiUrl}/categories/`).catch(() => ({ data: [] })),
        axios.get(`${environment.apiUrl}/skills/`)
      ]);
      const skills = skillRes.data;
      const categories = categoryRes.data ?? [];
      this.categoryList = categories;
      this.categoryColors = categories.reduce((map: Record<string, string>, c: any) => {
        map[c.name] = c.color;
        return map;
      }, {} as Record<string, string>);
      console.log('skills fetched', skills?.length);

      this.skills = skills ?? [];

      const categorySet = new Set<string>();
      const levelSet = new Set<number>();
      skills.forEach((s: any) => {
        if (s?.category) categorySet.add(s.category);
        if (Number.isFinite(s?.level)) levelSet.add(Number(s.level));
      });

      // create main nodes and separate "level nodes" that are children (data.parent set to main node id)
      const nodeElements = skills.map((s: any) => ({
        data: {
          id: 'skill-' + s.id,
          label: s.name,
          category: s.category,
          color: this.categoryColors[s.category] ?? '#d1d5db',
          level: s.level,
          parent_id: s.parent_id,
          description: s.description,
          user_comment: s.user_comment
        }
      }));

      // level nodes are independent nodes (not compound children); use attachedTo to find parent
      const levelNodes = skills.map((s: any) => ({
        data: {
          id: `skill-${s.id}-level`,
          label: this.levelToStars(s.level),
          level: s.level,
          attachedTo: `skill-${s.id}`
        },
        classes: 'level-node'
      }));

      const edgeElements = skills
        .filter((s: any) => s.parent_id !== null && s.parent_id !== undefined && s.parent_id !== s.id)
        .map((s: any) => ({
          data: {
            id: `edge-${s.parent_id}-${s.id}`,
            source: `skill-${s.parent_id}`,
            target: `skill-${s.id}`
          }
        }));

      // assemble nodes + level nodes + edges
      this.elements = [...nodeElements, ...levelNodes, ...edgeElements];
      console.log('built elements', this.elements.length);

      this.refreshTableRows();

      this.categoryOptions = Array.from(categorySet).sort();
      this.levelOptions = Array.from(levelSet).sort((a, b) => a - b);
      this.selectedCategories = new Set(this.categoryOptions);
      const defaultLevels = this.levelOptions.filter((lvl) => lvl > 0);
      this.selectedLevels = new Set(defaultLevels.length > 0 ? defaultLevels : this.levelOptions);

      // If cytoscape is already initialized (e.g., data arrives after view init), add elements
      if (this.cy) {
        this.addElementsToCytoscape(this.elements);
      }
    } catch (error) {
      console.error('Failed to fetch skills', error);
      this.elements = [];
    }
  }

  ngAfterViewInit() {
    // Initialize cytoscape after the view is available
    this.initCytoscape();

    // If data already fetched (even if empty array), add elements so demo fallback renders when empty
    if (this.elements) {
      this.addElementsToCytoscape(this.elements);
    }
  }

  initCytoscape() {
    const container = document.getElementById('cy');
    if (!container) {
      console.error('cy container not found');
      return;
    }

    console.log('cy container size', container.clientWidth, container.clientHeight);

    this.cy = cytoscape({
      container,
      elements: [],
      style: [
        // Main node style (shows skill name)
        {
          selector: 'node:not(.level-node)',
          style: {
            'background-color': 'data(color)',
            'shape': 'round-rectangle',
            'color': '#000',
            'label': 'data(label)',
            // put label slightly below the node center - now configurable
            'text-valign': this.mainLabelConfig.textValign,
            'text-margin-y': this.mainLabelConfig.textMarginY,
            'text-halign': this.mainLabelConfig.textHalign,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'font-size': '14px',
            'width': 'mapData(level, 1, 5, 80, 160)',
            'height': 'mapData(level, 1, 5, 56, 96)'
          }
        },
        // Level node style (small/italic/monospace inside parent)
        {
          selector: 'node.level-node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-style': 'italic',
            'font-family': 'Courier New, monospace',
            'color': '#333',
            'text-valign': 'bottom',
            'text-margin-y': -4,
            'background-opacity': 0,
            'border-width': 0,
            'width': '80px',
            'height': '14px'
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'width': 2,
            'line-color': '#999',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#999'
          }
        },
        // searched/highlight/faded styles
        {
          selector: 'node.searched',
          style: {
            'border-width': 3,
            'border-color': '#FFD54F',
            'background-color': '#fff',
            'width': 'mapData(level, 1, 5, 90, 180)'
          }
        },
        {
          // only apply highlight sizing to main nodes (exclude level nodes)
          selector: 'node.selected',
          style: {
            'border-width': 4,
            'border-color': '#FF5A5F',
            'background-color': '#ffffff',
            'width': 'mapData(level, 1, 5, 100, 200)'
          }
        },
        {
          selector: 'node.faded',
          style: {
            'opacity': 0.1,
            'text-opacity': 0.2
          }
        },
        {
          selector: 'edge.faded',
          style: {
            'opacity': 0.05
          }
        },
      ],
      // Use centralized options
      layout: (this.getLayoutOptions(this.layoutName) as any)
    });

    // Ensure we perform a resize/fit after layout stops, which is more reliable
    this.cy.on('layoutstop', () => {
      console.log('layoutstop:', {
        nodes: this.cy.nodes().length,
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        bbox: this.cy.elements().boundingBox()
      });
      // schedule a resize and fit in the next animation frame
      requestAnimationFrame(() => {
        try {
          this.cy.resize();
          this.fit();
          this.cy.center();
          // After layout/fit, position level nodes inside their parent and lock them
          this.positionLevelNodes();
        } catch (err) {
          console.warn('cy resize/fit failed at layoutstop', err);
        }
      });
    });

    // expose cy on window for quick debugging from the console
    (window as any).cy = this.cy;

    // make attached level nodes follow their parent when the parent moves (drag or programmatic position change)
    const repositionAttached = (node: any) => {
      const id = node.id();
      const bbox = node.boundingBox();
      const x = (bbox.x1 + bbox.x2) / 2;
      // place the level node slightly above the parent's center (configurable)
      const centerY = (bbox.y1 + bbox.y2) / 2;

      // use config values
      const lvlHeight = this.levelNodeConfig.height;
      const marginInside = this.levelNodeConfig.marginInside;
      const desiredY = centerY - this.levelNodeConfig.verticalOffsetFactor * bbox.h;
      const minY = bbox.y1 + (lvlHeight / 2) + marginInside;
      const y = Math.max(desiredY, minY);

      this.cy.nodes(`.level-node[attachedTo = "${id}"]`).forEach((lvl: any) => {
        try {
          // ensure user cannot grab level nodes directly
          if ((lvl as any).ungrabify) (lvl as any).ungrabify();
          // size the level node relative to parent width (clamped)
          const lvlWidth = Math.max(Math.min(bbox.w * 0.5, this.levelNodeConfig.maxWidth), this.levelNodeConfig.minWidth);
          lvl.style('width', lvlWidth);
          lvl.style('height', lvlHeight);
          lvl.style('z-index', 999);
          lvl.position({ x, y });
        } catch {
          // ignore
        }
      });
    };

    // reposition while dragging for immediate feedback
    this.cy.on('drag', 'node:not(.level-node)', (evt: any) => {
      repositionAttached(evt.target);
    });
    // reposition when position changes programmatically (e.g., layouts)
    this.cy.on('position', 'node:not(.level-node)', (evt: any) => {
      repositionAttached(evt.target);
    });

    // Node click => populate details (only for main nodes)
    this.cy.on('tap', 'node:not(.level-node)', (evt: any) => {
      const node = evt.target;
      const data = node.data();
      // Cytoscape events run outside Angular zone: ensure UI updates happen inside Angular zone
      this.ngZone.run(() => {
        this.clearNodeSelection();
        node.addClass('selected');
        this.selectedNode = { ...data };
        this.selectedLevel = Number(data.level ?? 0);
        this.selectedComment = data.user_comment ?? '';
        this.editedComment = this.selectedComment;
        this.saveMessage = '';
        this.saveError = false;
        this.sidebarCollapsed = false;
        this.cdr.detectChanges();
      });
    });

    // When a level node is tapped, behave as if its parent was tapped
    this.cy.on('tap', 'node.level-node', (evt: any) => {
      const lvl = evt.target;
      const parentId = lvl.data('attachedTo');
      if (!parentId) return;
      const parent = this.cy.getElementById(parentId);
      if (parent && parent.length > 0) {
        this.ngZone.run(() => {
          this.clearNodeSelection();
          parent.addClass('selected');
          this.selectedNode = { ...parent.data() };
          this.selectedLevel = Number(parent.data('level') ?? 0);
          this.selectedComment = parent.data('user_comment') ?? '';
          this.editedComment = this.selectedComment;
          this.saveMessage = '';
          this.saveError = false;
          this.sidebarCollapsed = false;
          this.cdr.detectChanges();
        });
      }
    });

    // Click background to clear selection
    this.cy.on('tap', (evt: any) => {
      // If the tap target is the core (background)
      if (evt.target === this.cy || evt.target === evt.cy) {
        this.clearSelection();
      }
    });

    window.addEventListener('resize', () => {
      if (this.cy) {
        this.cy.resize();
        this.fit();
        // re-position level nodes when size changes
        this.positionLevelNodes();
      }
    });

    // ensure initial rendering is correct by calling resize/fit after the initial creation
    requestAnimationFrame(() => {
      if (this.cy) {
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          // container size seems zero; log and try again after a short delay
          console.warn('cy container zero-sized at init', container.clientWidth, container.clientHeight);
          setTimeout(() => {
            this.cy.resize();
            this.fit();
            this.cy.center();
          }, 50);
        } else {
          this.cy.resize();
          this.fit();
          this.cy.center();
        }
      }
    });
  }

  // Position small level nodes at the bottom center of their parent main node and lock them
  positionLevelNodes() {
    if (!this.cy) return;
    this.cy.nodes('.level-node').forEach((lvl: any) => {
      const parentId = lvl.data('attachedTo');
      const parent = this.cy.getElementById(parentId);
      if (parent && parent.length > 0) {
        const bbox = parent.boundingBox();
        const x = (bbox.x1 + bbox.x2) / 2;
        const centerY = (bbox.y1 + bbox.y2) / 2;

        // use config values and position slightly above center
        const lvlHeight = this.levelNodeConfig.height;
        const marginInside = this.levelNodeConfig.marginInside;
        const desiredY = centerY + this.levelNodeConfig.verticalOffsetFactor * bbox.h;
        const minY = bbox.y1 + (lvlHeight / 2) + marginInside;
        const y = Math.max(desiredY, minY);
        try {
          // prevent user dragging the level node directly
          if ((lvl as any).ungrabify) (lvl as any).ungrabify();
          // adjust size to fit inside the parent
          const lvlWidth = Math.max(Math.min(bbox.w * 0.5, this.levelNodeConfig.maxWidth), this.levelNodeConfig.minWidth);
          lvl.style('width', lvlWidth);
          lvl.style('height', lvlHeight);
          lvl.style('z-index', 999);
          lvl.position({ x, y });
        } catch {
          // ignore positioning errors in some environments
        }
      }
    });
  }

  addElementsToCytoscape(elements: any[]) {
    if (!this.cy) {
      console.warn('Cytoscape not initialized yet, skipping addElements');
      return;
    }

    // Defensive: if no elements, create a debug node so we can verify Cytoscape renders
    if (!elements || elements.length === 0) {
      elements = [
        { data: { id: 'skill-1', label: 'Demo Node', category: 'Backend', level: 2 } },
        { data: { id: 'skill-1-level', label: 'Lv.2', level: 2, attachedTo: 'skill-1' }, classes: 'level-node' }
      ];
      console.warn('No elements provided; adding a demo node for debugging.');
    }

    console.log('adding elements to cy:', elements.length, 'container size', (document.getElementById('cy')?.clientWidth), (document.getElementById('cy')?.clientHeight));
    this.cy.startBatch();
    try {
      this.cy.elements().remove();
      this.cy.add(elements);

      // make level nodes ungrabify (prevent direct dragging) and unselectify (prevent direct selection)
      this.cy.nodes('.level-node').forEach((lvl: any) => {
        try {
          if ((lvl as any).ungrabify) (lvl as any).ungrabify();
          if ((lvl as any).unselectify) (lvl as any).unselectify();
        } catch {
          // ignore
        }
      });

      // run layout only on non-level elements so level nodes are not rearranged by layout
      const layout = this.cy.elements(':not(.level-node)').layout((this.getLayoutOptions(this.layoutName) as any));
      layout.run();

      this.applyFilters();

      // fallback: ensure resize/fit after a small delay in case layoutstop isn't triggered or complete
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (this.cy) {
            try {
              this.cy.resize();
              this.fit();
              this.cy.center();
              // fallback positioning too
              this.positionLevelNodes();
            } catch (e) {
              // ignore
            }
          }
        });
      }, 100);
    } finally {
      this.cy.endBatch();
    }
  }

  levelToStars(level: number | string | null | undefined) {
    const l = Math.max(0, Math.min(5, Number(level) || 0));
    return l === 0 ? '☆' : '★'.repeat(l);
  }

  // Toolbar actions
  fit() {
    if (!this.cy) return;

    const visibleMainNodes = this.cy.nodes(':not(.level-node):visible');
    const totalCategories = this.categoryOptions.length;
    const hasCategoryFilter = totalCategories > 0 && this.selectedCategories.size > 0 && this.selectedCategories.size < totalCategories;

    if (hasCategoryFilter) {
      const categoryNodes = visibleMainNodes.filter((n: any) => this.selectedCategories.has(n.data('category')));
      if (categoryNodes.length > 0) {
        const attachedLevelNodes = this.cy.collection();
        categoryNodes.forEach((n: any) => {
          attachedLevelNodes.merge(this.cy.nodes(`.level-node[attachedTo = "${n.id()}"]`));
        });

        const targets = categoryNodes.union(attachedLevelNodes);
        this.cy.fit(targets, 20);
        return;
      }
    }

    if (visibleMainNodes.length > 0) {
      const attachedLevelNodes = this.cy.collection();
      visibleMainNodes.forEach((n: any) => attachedLevelNodes.merge(this.cy.nodes(`.level-node[attachedTo = "${n.id()}"]`)));
      this.cy.fit(visibleMainNodes.union(attachedLevelNodes), 20);
      return;
    }

    this.cy.fit(null, 20);
  }

  zoomIn() {
    if (!this.cy) return;
    this.cy.zoom({ level: Math.min(this.cy.zoom() * 1.2, 4) });
  }

  zoomOut() {
    if (!this.cy) return;
    this.cy.zoom({ level: Math.max(this.cy.zoom() / 1.2, 0.2) });
  }

  switchLayout() {
    if (!this.cy) return;

    this.layoutName = this.layoutName === 'dagre' ? 'breadthfirst' : 'dagre';

    // Use centralized configuration for constructing the layout options
    const newLayoutOpts = this.getLayoutOptions(this.layoutName);
    this.cy.layout(newLayoutOpts as any).run();

    this.fit();
  }


  applySearch(term: string) {
    this.searchTerm = (term ?? '').trim();
    this.applyFilters();
  }

  toggleLevelMenu() {
    this.levelMenuOpen = !this.levelMenuOpen;
    if (this.levelMenuOpen) this.categoryMenuOpen = false;
  }

  toggleCategoryMenu() {
    this.categoryMenuOpen = !this.categoryMenuOpen;
    if (this.categoryMenuOpen) this.levelMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenusOnOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter')) {
      this.levelMenuOpen = false;
      this.categoryMenuOpen = false;
    }
  }

  get levelSelectionLabel() {
    if (this.levelOptions.length === 0) return '0';
    if (this.selectedLevels.size === this.levelOptions.length) return 'すべて';
    return String(this.selectedLevels.size);
  }

  get categorySelectionLabel() {
    if (this.categoryOptions.length === 0) return '0';
    if (this.selectedCategories.size === this.categoryOptions.length) return 'すべて';
    return String(this.selectedCategories.size);
  }

  toggleLevelSelection(level: number, checked: boolean) {
    const wasLevelZeroSelected = this.selectedLevels.has(0);
    if (checked) {
      this.selectedLevels.add(level);
    } else {
      this.selectedLevels.delete(level);
    }
    const levelZeroChanged = level === 0 && wasLevelZeroSelected !== this.selectedLevels.has(0);
    this.applyFilters(levelZeroChanged);
  }

  toggleCategorySelection(category: string, checked: boolean) {
    if (checked) {
      this.selectedCategories.add(category);
    } else {
      this.selectedCategories.delete(category);
    }
    this.applyFilters(true);
  }

  refreshTableRows() {
    this.filteredTableRows = this.computeFilteredRows();
  }

  toggleSort(column: 'label' | 'category' | 'level' | 'user_comment' | 'description') {
    if (this.sortState.column === column) {
      this.sortState = {
        column,
        direction: this.sortState.direction === 'asc' ? 'desc' : 'asc'
      };
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.refreshTableRows();
  }

  toggleEditingMode() {
    if (this.viewMode !== 'graph') return;
    this.editingMode = !this.editingMode;
  }

  private clampLevelValue(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(5, Math.floor(value)));
  }

  private pushSkillToState(skill: any) {
    this.skills.push(skill);
    const color = this.categoryColors[skill.category] ?? '#d1d5db';
    const node = {
      data: {
        id: `skill-${skill.id}`,
        label: skill.name,
        category: skill.category,
        color,
        level: skill.level,
        parent_id: skill.parent_id,
        description: skill.description,
        user_comment: skill.user_comment
      }
    };
    const lvlNode = {
      data: {
        id: `skill-${skill.id}-level`,
        label: this.levelToStars(skill.level),
        level: skill.level,
        attachedTo: `skill-${skill.id}`
      },
      classes: 'level-node'
    };
    const edge =
      skill.parent_id && skill.parent_id !== skill.id
        ? {
            data: {
              id: `edge-${skill.parent_id}-${skill.id}`,
              source: `skill-${skill.parent_id}`,
              target: `skill-${skill.id}`
            }
          }
        : null;

    this.elements = edge ? [...this.elements, node, lvlNode, edge] : [...this.elements, node, lvlNode];
    if (this.cy) {
      this.addElementsToCytoscape(this.elements);
    }
    if (!this.categoryOptions.includes(skill.category)) {
      this.categoryOptions.push(skill.category);
      this.categoryOptions.sort();
    }
    if (!this.levelOptions.includes(skill.level)) {
      this.levelOptions.push(skill.level);
      this.levelOptions.sort((a, b) => a - b);
    }
    this.selectedCategories.add(skill.category);
    this.selectedLevels.add(skill.level);
    this.refreshTableRows();
  }

  async createSkill() {
    if (!this.editingMode || this.viewMode !== 'graph') return;
    const payload = {
      name: this.newSkill.name.trim(),
      category: this.newSkill.category.trim(),
      level: this.clampLevelValue(this.newSkill.level),
      description: this.newSkill.description ?? '',
      user_comment: '',
      parent: this.newSkill.parent_id ? { id: this.newSkill.parent_id } : null
    };
    if (!payload.name || !payload.category) return;
    const response = await axios.post(`${environment.apiUrl}/skills/`, payload);
    const created = response.data;
    created.parent_id = created.parent_id ?? this.newSkill.parent_id;
    this.pushSkillToState(created);
    if (this.newSkill.color) {
      await this.saveCategoryColorInternal(payload.category, this.newSkill.color);
    }
    this.newSkill = { name: '', category: '', level: 0, description: '', parent_id: null, color: '#4a5568' };
  }

  async deleteSelectedSkill() {
    if (!this.editingMode || this.viewMode !== 'graph' || !this.selectedNode) return;
    const match = String(this.selectedNode.id ?? '').match(/^skill-(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    await axios.delete(`${environment.apiUrl}/skills/${id}/`);
    this.elements = this.elements.filter((el) => {
      return !(
        (el.data?.id && String(el.data.id) === `skill-${id}`) ||
        (el.data?.id && String(el.data.id) === `skill-${id}-level`) ||
        (el.data?.source && String(el.data.source) === `skill-${id}`) ||
        (el.data?.target && String(el.data.target) === `skill-${id}`)
      );
    });
    this.skills = this.skills.filter((s: any) => Number(s.id) !== id);
    if (this.cy) {
      this.addElementsToCytoscape(this.elements);
    }
    this.clearSelection();
    this.refreshTableRows();
  }

  async saveDescription() {
    if (!this.editingMode || !this.selectedNode) return;
    const match = String(this.selectedNode.id ?? '').match(/^skill-(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    await axios.patch(`${environment.apiUrl}/skills/${id}/`, { description: this.selectedNode.description ?? '' });
    const target = this.skills.find((s: any) => Number(s.id) === id);
    if (target) target.description = this.selectedNode.description;
    this.refreshTableRows();
  }

  async saveCategoryColor() {
    if (!this.editingCategory.name.trim()) return;
    await this.saveCategoryColorInternal(this.editingCategory.name.trim(), this.editingCategory.color.trim());
    this.editingCategory = { name: '', color: '#4a5568' };
  }

  private async saveCategoryColorInternal(name: string, color: string) {
    const existing = this.categoryList.find((c) => c.name === name);
    if (existing) {
      await axios.put(`${environment.apiUrl}/categories/${existing.id}/`, { name, color });
      existing.color = color;
    } else {
      const res = await axios.post(`${environment.apiUrl}/categories/`, { name, color });
      this.categoryList.push(res.data);
    }
    this.categoryColors[name] = color;
    this.cy?.nodes(`[category = "${name}"]`).forEach((n: any) => n.data('color', color));
    this.categoryOptions = Array.from(new Set([...this.categoryOptions, name])).sort();
    this.refreshTableRows();
  }

  sortIndicator(column: 'label' | 'category' | 'level' | 'user_comment' | 'description') {
    if (this.sortState.column !== column) return '';
    return this.sortState.direction === 'asc' ? '▲' : '▼';
  }

  private computeFilteredRows() {
    const levelOptionsLen = this.levelOptions?.length ?? 0;
    const categoryOptionsLen = this.categoryOptions?.length ?? 0;
  
    const hasActiveSearch = (this.searchTerm ?? '') !== '';
    const hasLevelFilter =
      this.selectedLevels.size > 0 &&
      levelOptionsLen > 0 &&
      this.selectedLevels.size < levelOptionsLen;
  
    const hasCategoryFilter =
      this.selectedCategories.size > 0 &&
      categoryOptionsLen > 0 &&
      this.selectedCategories.size < categoryOptionsLen;
  
    const isLevelZeroSelected = this.selectedLevels.has(0);
    const lower = (this.searchTerm ?? '').toLowerCase();
  
    const filtered = (this.skills ?? []).filter((skill: any) => {
      if (!isLevelZeroSelected && Number(skill.level) === 0) return false;
      if (hasCategoryFilter && !this.selectedCategories.has(skill.category)) return false;
      if (hasLevelFilter && !this.selectedLevels.has(skill.level)) return false;
      if (hasActiveSearch && !String(skill.name ?? skill.label ?? '').toLowerCase().includes(lower)) return false;
      return true;
    });
  
    const sorted = [...filtered].sort((a, b) => {
      const { column, direction } = this.sortState;
      const dir = direction === 'asc' ? 1 : -1;
  
      if (column === 'level') return (Number(a.level) - Number(b.level)) * dir;
  
      const av = String(column === 'label' ? (a.name ?? a.label ?? '') : a[column] ?? '').toLowerCase();
      const bv = String(column === 'label' ? (b.name ?? b.label ?? '') : b[column] ?? '').toLowerCase();
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  
    return sorted.map((skill) => ({ ...skill }));
  }

  applyFilters(forceRelayout: boolean = false) {
    if (!this.cy) return;
   
    // options が未準備でも落ちないようにする（中間状態対策）
    const levelOptionsLen = this.levelOptions?.length ?? 0;
    const categoryOptionsLen = this.categoryOptions?.length ?? 0;
   
    const mainNodes = this.cy.nodes(':not(.level-node)');
    const levelNodes = this.cy.nodes('.level-node');
    const edges = this.cy.edges();
   
    mainNodes.removeClass('searched faded');
    edges.removeClass('faded');
   
    let needsRelayout = forceRelayout;
   
    const ensureDisplay = (ele: any, value: 'none' | 'element') => {
      if (ele.style('display') !== value) {
        ele.style('display', value);
        needsRelayout = true;
      }
    };
   
    mainNodes.forEach((n: any) => ensureDisplay(n, 'element'));
    levelNodes.forEach((n: any) => ensureDisplay(n, 'element'));
    edges.forEach((e: any) => ensureDisplay(e, 'element'));
  
    const hasActiveSearch = (this.searchTerm ?? '') !== '';
    const hasLevelFilter =
      this.selectedLevels.size > 0 &&
      levelOptionsLen > 0 &&
      this.selectedLevels.size < levelOptionsLen;
  
    const hasCategoryFilter =
      this.selectedCategories.size > 0 &&
      categoryOptionsLen > 0 &&
      this.selectedCategories.size < categoryOptionsLen;
  
    const isLevelZeroSelected = this.selectedLevels.has(0);
    const lower = (this.searchTerm ?? '').toLowerCase();
  
    const hideNodeAndConnections = (node: any) => {
      ensureDisplay(node, 'none');
      const id = node.id();
      this.cy.nodes(`.level-node[attachedTo = "${id}"]`).forEach((lvl: any) => ensureDisplay(lvl, 'none'));
      this.cy.edges(`[source = "${id}"], [target = "${id}"]`).forEach((edge: any) => ensureDisplay(edge, 'none'));
    };
  
    if (hasCategoryFilter) {
      mainNodes.forEach((n: any) => {
        const category = n.data('category');
        if (!this.selectedCategories.has(category)) {
          hideNodeAndConnections(n);
        }
      });
    }
  
    if (!isLevelZeroSelected) {
      mainNodes.forEach((n: any) => {
        const level = Number(n.data('level'));
        if (level === 0) {
          hideNodeAndConnections(n);
        }
      });
    }
  
    const visibleMainNodes = mainNodes.filter(':visible');
  
    const filtered = visibleMainNodes.filter((n: any) => {
      const label = String(n.data('label') ?? '').toLowerCase();
      const level = n.data('level');
      const category = n.data('category');
  
      if (hasActiveSearch && !label.includes(lower)) return false;
      if (hasLevelFilter && !this.selectedLevels.has(level)) return false;
      if (hasCategoryFilter && !this.selectedCategories.has(category)) return false;
  
      return true;
    });
  
    if (!hasActiveSearch && !hasLevelFilter && !hasCategoryFilter) {
      if (needsRelayout) this.relayoutVisibleElements();
      this.refreshTableRows();
      return;
    }
  
    visibleMainNodes.addClass('faded');
    edges.addClass('faded');
  
    filtered.removeClass('faded');
  
    if (hasActiveSearch) {
      filtered.addClass('searched');
    }
  
    filtered.forEach((n: any) => {
      const id = n.id();
      this.cy.nodes(`.level-node[attachedTo = "${id}"]`).removeClass('faded');
    });
  
    filtered.connectedEdges().removeClass('faded');
  
    if (needsRelayout) this.relayoutVisibleElements();
  
    this.refreshTableRows();
  }  

  private relayoutVisibleElements() {
    if (!this.cy) return;
  
    const visibleMainNodes = this.cy.nodes(':not(.level-node):visible');
    if (!visibleMainNodes || visibleMainNodes.length === 0) return;
  
    try {
      const layout = visibleMainNodes.layout((this.getLayoutOptions(this.layoutName) as any));
      layout.run();
    } catch (e) {
      console.warn('relayoutVisibleElements skipped', e);
      return;
    }
  
    requestAnimationFrame(() => {
      try {
        this.positionLevelNodes();
        this.fit();
      } catch { /* ignore */ }
    });
  }

  refreshLevelOptionsFromGraph() {
    if (!this.cy) return;
  
    const levelSet = new Set<number>();
    this.cy.nodes(':not(.level-node)').forEach((n: any) => {
      const level = Number(n.data('level'));
      if (Number.isFinite(level)) levelSet.add(level);
    });
  
    const newOptions = Array.from(levelSet).sort((a, b) => a - b);
  
    const prevAllSelected =
      (this.levelOptions?.length ?? 0) > 0 &&
      this.selectedLevels.size === (this.levelOptions?.length ?? 0);
  
    const previousSelection = new Set(this.selectedLevels);
  
    // ここで options を更新
    this.levelOptions = newOptions;
  
    const nextSelection = new Set<number>();
    if (prevAllSelected || previousSelection.size === 0) {
      newOptions.forEach((l) => nextSelection.add(l));
    } else {
      newOptions.forEach((l) => {
        if (previousSelection.has(l)) nextSelection.add(l);
      });
    }
  
    this.selectedLevels = nextSelection;
  }


  clearSelection() {
    if (!this.cy) return;
    this.clearNodeSelection();
    this.selectedNode = null;
    this.selectedLevel = null;
    this.selectedComment = '';
    this.editedComment = '';
    this.saveMessage = '';
    this.saveError = false;
    // ensure UI immediately reflects cleared state
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  clearNodeSelection() {
    if (!this.cy) return;
    this.cy.nodes().removeClass('selected');
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleViewMode(nextMode?: 'graph' | 'table') {
    this.viewMode = nextMode ?? (this.viewMode === 'graph' ? 'table' : 'graph');
    if (this.viewMode === 'table' && this.editingMode) {
      this.editingMode = false;
    }

    if (this.viewMode === 'graph' && this.cy) {
      requestAnimationFrame(() => {
        try {
          this.cy.resize();
          this.fit();
          this.positionLevelNodes();
        } catch { }
      });
    }

    this.refreshTableRows();
  }

  downloadCsv() {
    if (!this.filteredTableRows || this.filteredTableRows.length === 0) return;

    const headers = ['ID', 'Name', 'Category', 'Level', 'Description', 'User Comment'];
    const lines = this.filteredTableRows.map((row: any) => [
      row.id,
      row.name ?? row.label ?? '',
      row.category ?? '',
      row.level ?? '',
      (row.description ?? '').replace(/\r?\n/g, ' '),
      row.user_comment ?? ''
    ]);

    const csvContent = [headers, ...lines]
      .map((line) => line.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadPng() {
    if (!this.cy) return;
    const data = this.cy.png({ full: true, bg: '#ffffff' });
    const a = document.createElement('a');
    a.href = data;
    a.download = 'techtree.png';
    a.click();
  }

  selectSkillFromTable(row: any) {
    if (!row || row.id == null) return;
    this.selectSkillById(Number(row.id));
  }

  private selectSkillById(skillId: number) {
    const nodeId = `skill-${skillId}`;
    const node = this.cy?.getElementById(nodeId);
    const nodeData = node && node.length > 0 ? node.data() : this.skills.find((s: any) => Number(s.id) === Number(skillId));

    if (!nodeData) return;

    this.ngZone.run(() => {
      this.clearNodeSelection();
      if (node && node.length > 0) {
        node.addClass('selected');
      }

      this.selectedNode = { ...nodeData, id: nodeId };
      this.selectedLevel = Number(nodeData.level ?? 0);
      this.selectedComment = nodeData.user_comment ?? '';
      this.editedComment = this.selectedComment;
      this.saveMessage = '';
      this.saveError = false;
      this.sidebarCollapsed = false;
      this.cdr.detectChanges();
    });
  }

  // for level editing
  selectedLevel: number | null = null;
  selectedComment = '';
  editedComment = '';
  isSavingDetails = false;
  saveMessage = '';
  saveError = false;

  // Called when user edits the number field
  onLevelInput(value: string | number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    const nextLevel = Math.max(0, Math.min(5, Math.floor(v)));
    if (this.selectedLevel !== nextLevel) {
      this.selectedLevel = nextLevel;
      this.persistDetails({ level: nextLevel });
    }
  }

  incrementLevel() {
    if (this.selectedLevel == null) this.selectedLevel = 0;
    const nextLevel = Math.min(5, this.selectedLevel + 1);
    this.selectedLevel = nextLevel;
    this.persistDetails({ level: nextLevel });
  }

  decrementLevel() {
    if (this.selectedLevel == null) this.selectedLevel = 0;
    const nextLevel = Math.max(0, Math.min(5, this.selectedLevel - 1));
    this.selectedLevel = nextLevel;
    this.persistDetails({ level: nextLevel });
  }

  onCommentBlur() {
    this.persistDetails({ user_comment: this.editedComment ?? '' });
  }

  onTableLevelBlur(row: any, value: string | number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    const nextLevel = Math.max(0, Math.min(5, Math.floor(v)));
    if (nextLevel === row.level) return;
    this.saveSkill(Number(row.id), { level: nextLevel }, row.level).catch((err) =>
      console.error('Failed to save level from table', err)
    );
  }

  onTableCommentBlur(row: any, value: string) {
    const nextComment = value ?? '';
    if ((row.user_comment ?? '') === nextComment) return;
    this.saveSkill(Number(row.id), { user_comment: nextComment }).catch((err) =>
      console.error('Failed to save comment from table', err)
    );
  }

  private applySkillChanges(skillId: number, payload: { level?: number; user_comment?: string }) {
    const skill = this.skills.find((s: any) => Number(s.id) === Number(skillId));
    if (skill) {
      if (payload.level != null) skill.level = payload.level;
      if (payload.user_comment != null) skill.user_comment = payload.user_comment;
    }

    const nodeId = `skill-${skillId}`;
    if (payload.level != null && this.cy) {
      const mainNode = this.cy.getElementById(nodeId);
      if (mainNode && mainNode.length > 0) {
        mainNode.data('level', payload.level);
      }

      const levelNode = this.cy.getElementById(`${nodeId}-level`);
      if (levelNode && levelNode.length > 0) {
        levelNode.data('label', this.levelToStars(payload.level));
        levelNode.data('level', payload.level);
      }
    }

    if (payload.user_comment != null && this.cy) {
      const mainNode = this.cy.getElementById(nodeId);
      if (mainNode && mainNode.length > 0) {
        mainNode.data('user_comment', payload.user_comment);
      }
    }

    if (this.selectedNode && this.selectedNode.id === nodeId) {
      this.selectedNode = { ...this.selectedNode, ...payload };
      if (payload.level != null) this.selectedLevel = payload.level;
      if (payload.user_comment != null) {
        this.selectedComment = payload.user_comment;
        this.editedComment = payload.user_comment;
      }
    }

    this.refreshTableRows();
  }

  private async saveSkill(
    skillId: number,
    payload: { level?: number; user_comment?: string },
    originalLevel?: number
  ) {
    if (!payload || Object.keys(payload).length === 0) return;
  
    await axios.patch(`${environment.apiUrl}/skills/${skillId}/`, payload);
  
    this.applySkillChanges(skillId, payload);
  
    // options更新（ここでは applyFilters は呼ばない）
    this.refreshLevelOptionsFromGraph();
  
    const needsRelayout = payload.level != null && (payload.level === 0 || originalLevel === 0);
  
    // ここで1回だけ filter & relayout
    this.applyFilters(needsRelayout);
  
    requestAnimationFrame(() => {
      try {
        if (this.cy) {
          this.cy.resize();
          this.fit();
          this.positionLevelNodes();
        }
      } catch { /* ignore */ }
    });
  }

  private async persistDetails(change: { level?: number; user_comment?: string }) {
    if (!this.selectedNode) return;
    const dataId: string = this.selectedNode.id ?? this.selectedNode['id'];
    const match = String(dataId).match(/^skill-(\d+)$/);
    if (!match) {
      this.ngZone.run(() => {
        this.saveMessage = 'Invalid node id';
        this.saveError = true;
        this.cdr.detectChanges();
      });
      setTimeout(() => (this.saveMessage = ''), 2000);
      return;
    }
    const skillId = match[1];
  
    const payload: any = {};
    const originalLevel = this.selectedNode.level;
  
    if (change.level != null && change.level !== this.selectedNode.level) payload.level = change.level;
    if (change.user_comment != null && change.user_comment !== this.selectedNode.user_comment) payload.user_comment = change.user_comment;
  
    if (Object.keys(payload).length === 0) return;
  
    try {
      this.ngZone.run(() => {
        this.isSavingDetails = true;
        this.saveMessage = '🟡 Saving...';
        this.saveError = false;
        this.cdr.detectChanges();
      });
  
      await this.saveSkill(Number(skillId), payload, originalLevel);
  
      this.ngZone.run(() => {
        this.isSavingDetails = false;
        this.saveMessage = '🟢 Saved';
        this.saveError = false;
        this.cdr.detectChanges();
      });
      setTimeout(() => this.ngZone.run(() => (this.saveMessage = '')), 2000);
    } catch (err) {
      console.error('Failed to save details', err);
      this.ngZone.run(() => {
        this.isSavingDetails = false;
        // 「保存後のUI更新エラー」が正しい
        this.saveMessage = '保存は完了しましたが、画面更新でエラーが発生しました';
        this.saveError = true;
        this.cdr.detectChanges();
      });
    }
  }
}