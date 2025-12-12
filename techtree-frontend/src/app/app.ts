import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import axios from 'axios';

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
  readonly layoutConfig = {
    dagre: {
      name: 'dagre',
      rankDir: 'TB',   // top -> bottom
      nodeSep: 180,    // node separation (horizontal)
      rankSep: 240,    // rank separation (vertical)
      edgeSep: 30,
      padding: 20
    },
    grid: {
      name: 'grid',
      padding: 20
    }
  } as const;

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

      const nodeElements = skills.map((s: any) => ({
        data: {
          id: "skill-" + s.id,
          label: s.name,
          category: s.category,
          level: s.level,
          parent_id: s.parent_id
        }
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

      this.elements = [...nodeElements, ...edgeElements];
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
        {
          selector: 'node',
          style: {
            // fallback background color so nodes are visible even if category-specific styles fail
            'background-color': '#ddd',
            'shape': 'round-rectangle',
            'color': '#000',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'font-size': '14px',
            'width': 'mapData(level, 1, 5, 80, 160)',
            'height': '40px'
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
            'opacity': 0.25
          }
        },
        {
          selector: 'edge.faded',
          style: {
            'opacity': 0.1
          }
        }
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
        } catch (err) {
          console.warn('cy resize/fit failed at layoutstop', err);
        }
      });
    });

    // expose cy on window for quick debugging from the console
    (window as any).cy = this.cy;

    // Node click => populate details
    this.cy.on('tap', 'node', (evt: any) => {
      const node = evt.target;
      const data = node.data();
      this.clearNodeSelection();
      node.addClass('selected');
      this.selectedNode = { ...data };
      this.sidebarCollapsed = false;
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

  addElementsToCytoscape(elements: any[]) {
    if (!this.cy) {
      console.warn('Cytoscape not initialized yet, skipping addElements');
      return;
    }

    // Defensive: if no elements, create a debug node so we can verify Cytoscape renders
    if (!elements || elements.length === 0) {
      elements = [
        { data: { id: 'skill-1', label: 'Demo Node', category: 'Backend', level: 2 } }
      ];
      console.warn('No elements provided; adding a demo node for debugging.');
    }

    console.log('adding elements to cy:', elements.length, 'container size', (document.getElementById('cy')?.clientWidth), (document.getElementById('cy')?.clientHeight));
    this.cy.startBatch();
    try {
      this.cy.elements().remove();
      this.cy.add(elements);

      // run layout to place new nodes. layoutstop listener will handle resize/fit
      const layout = this.cy.layout((this.getLayoutOptions(this.layoutName) as any));
      layout.run();

      // fallback: ensure resize/fit after a small delay in case layoutstop isn't triggered or complete
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (this.cy) {
            try {
              this.cy.resize();
              this.fit();
              this.cy.center();
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

    if this.searchTerm === '' {
      // Reset state
      return;
    }

    const lower = this.searchTerm.toLowerCase();
    const matches = this.cy.nodes().filter((n: any) => (n.data('label') || '').toLowerCase().includes(lower));

    // fade all, then unfade matches
    this.cy.nodes().addClass('faded');
    matches.removeClass('faded').addClass('searched');

    // Fade edges not connected to any match
    this.cy.edges().addClass('faded');
    const connectedEdges = matches.connectedEdges();
    connectedEdges.removeClass('faded');
  }

  clearSelection() {
    if (!this.cy) return;
    this.clearNodeSelection();
    this.selectedNode = null;
  }

  clearNodeSelection() {
    if (!this.cy) return;
    this.cy.nodes().removeClass('selected');
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}

