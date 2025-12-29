import { Skill } from './skill.model';

export interface CardSelection {
  id: number;
  node_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  node?: Skill;
}
