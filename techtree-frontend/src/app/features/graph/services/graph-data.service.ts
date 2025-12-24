import { Injectable } from '@angular/core';
import { ElementDefinition } from 'cytoscape';
import { CategoryColor } from '../../../core/models/category-color.model';
import { Relation } from '../../../core/models/relation.model';
import { Skill } from '../../../core/models/skill.model';

@Injectable({ providedIn: 'root' })
export class GraphDataService {
  buildGraphState(
    skills: Skill[],
    relations: Relation[],
    previousColors: Record<string, string>
  ): { elements: ElementDefinition[]; categoryColors: Record<string, string>; categoryList: CategoryColor[] } {
    const categoryColors: Record<string, string> = { ...previousColors };

    skills.forEach((skill) => {
      if (!categoryColors[skill.category]) {
        categoryColors[skill.category] = this.generateRandomColor();
      }
    });

    const categoryList: CategoryColor[] = Object.entries(categoryColors).map(([name, color], idx) => ({
      id: idx + 1,
      name,
      color
    }));

    const nodeElements: ElementDefinition[] = skills.map((skill) => ({
      data: {
        id: `skill-${skill.id}`,
        label: skill.name,
        category: skill.category,
        color: categoryColors[skill.category] ?? '#d1d5db',
        level: skill.level,
        description: skill.description,
        user_comment: skill.user_comment
      }
    }));

    const levelNodes: ElementDefinition[] = skills.map((skill) => ({
      data: {
        id: `skill-${skill.id}-level`,
        label: this.levelToStars(skill.level),
        level: skill.level,
        attachedTo: `skill-${skill.id}`
      },
      classes: 'level-node'
    }));

    const edgeElements: ElementDefinition[] = relations
      .map((relation) => {
        const from = relation.from_node_id ?? relation.from_node?.id;
        const to = relation.to_node_id ?? relation.to_node?.id;
        if (from == null || to == null) return null;
        return {
          data: {
            id: `relation-${relation.id}`,
            source: `skill-${from}`,
            target: `skill-${to}`,
            relation_type: relation.relation_type,
            strength: relation.strength
          }
        } as ElementDefinition;
      })
      .filter((el): el is ElementDefinition => Boolean(el));

    return {
      elements: [...nodeElements, ...levelNodes, ...edgeElements],
      categoryColors,
      categoryList
    };
  }

  ensureCategoryColor(categoryColors: Record<string, string>, category: string): string {
    if (!category) return '#d1d5db';
    if (!categoryColors[category]) {
      categoryColors[category] = this.generateRandomColor();
    }
    return categoryColors[category];
  }

  private generateRandomColor() {
    const component = () => Math.floor(Math.random() * 156 + 80).toString(16).padStart(2, '0');
    return `#${component()}${component()}${component()}`;
  }

  private levelToStars(level: number | string | null | undefined) {
    const l = Math.max(0, Math.min(5, Number(level) || 0));
    return l === 0 ? '☆' : '★'.repeat(l);
  }
}
