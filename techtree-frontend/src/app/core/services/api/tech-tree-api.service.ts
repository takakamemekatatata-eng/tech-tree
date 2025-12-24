import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../../../environments/environment';
import { Skill } from '../../models/skill.model';
import { Relation } from '../../models/relation.model';

@Injectable({ providedIn: 'root' })
export class TechTreeApiService {
  async fetchSkills(): Promise<Skill[]> {
    const response = await axios.get(`${environment.apiUrl}/nodes/`);
    return response.data ?? [];
  }

  async fetchRelations(): Promise<Relation[]> {
    const response = await axios.get(`${environment.apiUrl}/relations/`);
    return response.data ?? [];
  }

  async createSkill(payload: {
    name: string;
    category: string;
    description?: string;
    tags?: string[];
    node_type?: string;
  }): Promise<Skill> {
    const response = await axios.post(`${environment.apiUrl}/nodes/`, payload);
    return response.data;
  }

  async deleteSkill(id: number): Promise<void> {
    await axios.delete(`${environment.apiUrl}/nodes/${id}/`);
  }

  async updateSkill(skillId: number, payload: Partial<Skill>): Promise<void> {
    await axios.patch(`${environment.apiUrl}/nodes/${skillId}/`, payload);
  }

  async createRelation(payload: {
    from_node_id: number;
    to_node_id: number;
    relation_type: string;
    strength: number;
  }): Promise<Relation> {
    const response = await axios.post(`${environment.apiUrl}/relations/`, payload);
    return response.data;
  }

  async updateRelation(relationId: number, payload: Partial<Relation>): Promise<void> {
    await axios.patch(`${environment.apiUrl}/relations/${relationId}/`, payload);
  }

  async deleteRelation(relationId: number): Promise<void> {
    await axios.delete(`${environment.apiUrl}/relations/${relationId}/`);
  }
}
