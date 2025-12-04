import { Component, OnInit } from '@angular/core';
import cytoscape from 'cytoscape';
import axios from 'axios';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {

  async ngOnInit() {
    const response = await axios.get('http://localhost:8000/skills/');
    const skills = response.data;

    const elements = skills.map((s: any) => ({
      data: { id: "skill-" + s.id, label: s.name }
    }));

    cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#4A90E2',
            'color': '#fff',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'width': '120px',
            'height': '40px'
          }
        }
      ],
      layout: { name: 'grid' }
    });
  }
}

