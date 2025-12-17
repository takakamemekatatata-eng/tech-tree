import { Component, OnInit, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import axios from 'axios';
import { layoutConfig, levelNodeConfig, mainLabelConfig } from './visual-config';
import { environment } from '../environments/environment';

cytoscape.use(dagre);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
   cy: any = null;
   selectedNode: any = null;
   searchTerm = '';
   sidebarCollapsed = false;
   layoutName = 'dagre'; 
   //layoutName = 'breadthfirst';
 
   elements: any[] = []; // store node + edge elements until cy is initialized

   // --------------------------
   // Centralized layout config
   // --------------------------
   // replaced inline definitions with imported configs
   readonly layoutConfig = layoutConfig;
   readonly levelNodeConfig = levelNodeConfig;
   readonly mainLabelConfig = mainLabelConfig;

   // inject ChangeDetectorRef and NgZone so Cytoscape callbacks can update Angular view
   constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

   // Helper: return layout options for a layout name
   getLayoutOptions(layoutName?: string) {
     const name = layoutName ?? this.layoutName;
     // Use `any` to avoid typing issues with cytoscape layout typed options
     return (this.layoutConfig as any)[name] ?? (this.layoutConfig as any).dagre;
   }

   async ngOnInit() {
     try {
       const response = await axios.get('http://localhost:8000/skills/');
       const skills = response.data;
       console.log('skills fetched', skills?.length);

      // create main nodes and separate "level nodes" that are children (data.parent set to main node id)
      const nodeElements = skills.map((s: any) => ({
        data: {
          id: 'skill-' + s.id,
          label: s.name,
          category: s.category,
          level: s.level,
          parent_id: s.parent_id
        }
      }));

      // level nodes are independent nodes (not compound children); use attachedTo to find parent
      const levelNodes = skills.map((s: any) => ({
        data: {
          id: `skill-${s.id}-level`,
          label: `Lv.${s.level}`,
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

     // If data already fetched, add elements
     if (this.elements && this.elements.length > 0) {
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
            'background-color': '#ddd',
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
            'width': '40px',
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
         {
           selector: 'node[category = "Backend"]',
           style: { 'background-color': '#4A90E2' }
         },
         {
           selector: 'node[category = "Frontend"]',
           style: { 'background-color': '#50C878' }
         },
         {
           selector: 'node[category = "Infra"]',
           style: { 'background-color': '#F5A623' }
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
        this.selectedLevel = Number(data.level ?? 1);
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
          this.selectedLevel = Number(parent.data('level') ?? 1);
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

  // Toolbar actions
  fit() {
    if (!this.cy) return;
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

    this.layoutName = this.layoutName === 'dagre' ? 'grid' : 'dagre';

    // Use centralized configuration for constructing the layout options
    const newLayoutOpts = this.getLayoutOptions(this.layoutName);
    this.cy.layout(newLayoutOpts as any).run();

    this.fit();
  }


  applySearch(term: string) {
     if (!this.cy) return;
     this.searchTerm = term.trim();
     this.cy.nodes().removeClass('searched faded');
 
     if (this.searchTerm === '') {
       // Reset state
       return;
     }
 
     const lower = this.searchTerm.toLowerCase();
    // search only main nodes by label, then show their level children too
    const matches = this.cy.nodes(':not(.level-node)').filter((n: any) => (n.data('label') || '').toLowerCase().includes(lower));
 
    // fade all, then unfade matches
    this.cy.nodes().addClass('faded');
    matches.removeClass('faded').addClass('searched');
    // make sure level nodes attached to matches are visible
    matches.forEach((n: any) => {
      const id = n.id();
      this.cy.nodes(`.level-node[attachedTo = "${id}"]`).removeClass('faded');
    });
 
     // Fade edges not connected to any match
     this.cy.edges().addClass('faded');
     const connectedEdges = matches.connectedEdges();
     connectedEdges.removeClass('faded');
   }

  clearSelection() {
    if (!this.cy) return;
    this.clearNodeSelection();
    this.selectedNode = null;
    this.selectedLevel = null;
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

  // for level editing
  selectedLevel: number | null = null;
  isSavingLevel = false;
  saveMessage = '';
  saveError = false;

  // Called when user edits the number field
  onLevelInput(value: string | number) {
    const v = Number(value);
    if (Number.isFinite(v) && v >= 1) {
      this.selectedLevel = Math.floor(v);
    }
  }

  incrementLevel() {
    if (this.selectedLevel == null) this.selectedLevel = 1;
    this.selectedLevel = this.selectedLevel + 1;
  }

  decrementLevel() {
    if (this.selectedLevel == null) this.selectedLevel = 1;
    this.selectedLevel = Math.max(1, this.selectedLevel - 1);
  }

  // Save updated level to backend and update cytoscape elements
  async saveLevel() {
    if (!this.selectedNode || this.selectedLevel == null) return;
    this.saveError = false;
    // extract numeric id from data id like 'skill-12'
    const dataId: string = this.selectedNode.id ?? this.selectedNode['id'];
    const match = String(dataId).match(/^skill-(\d+)$/);
    if (!match) {
      this.saveMessage = 'Invalid node id';
      this.saveError = true;
      setTimeout(() => (this.saveMessage = ''), 2000);
      return;
    }
    const skillId = match[1];

    try {
      this.isSavingLevel = true;
      this.saveMessage = 'Saving...';

      // PATCH backend (assumes endpoint exists at /skills/<id>/)
      await axios.patch(`${environment.apiUrl}/skills/${skillId}/`, { level: this.selectedLevel });

      // update selectedNode state
      this.selectedNode.level = this.selectedLevel;

      // update main cytoscape node's data to reflect new level (affects mapData sizing)
      const mainNode = this.cy.getElementById(`skill-${skillId}`);
      if (mainNode && mainNode.length > 0) {
        mainNode.data('level', this.selectedLevel);
      }

      // update the corresponding level-node label
      const levelNode = this.cy.getElementById(`skill-${skillId}-level`);
      if (levelNode && levelNode.length > 0) {
        levelNode.data('label', `Lv.${this.selectedLevel}`);
        levelNode.data('level', this.selectedLevel);
      }

      // schedule a small layout-update/resize so visual changes are visible
      requestAnimationFrame(() => {
        try {
          if (this.cy) {
            this.cy.resize();
            // no full layout to avoid repositioning; fit to keep viewport consistent
            this.fit();
            this.positionLevelNodes();
          }
        } catch {}
      });

      this.saveMessage = 'Saved';
      this.saveError = false;
      setTimeout(() => (this.saveMessage = ''), 2000);
    } catch (err) {
      console.error('Failed to save level', err);
      this.saveMessage = 'Save failed';
      this.saveError = true;
      setTimeout(() => (this.saveMessage = ''), 3000);
    } finally {
      this.isSavingLevel = false;
    }
  }
}

