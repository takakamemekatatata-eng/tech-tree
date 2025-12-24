export interface Skill {
  id: number;
  name: string;
  label?: string;
  category: string;
  level: number;
  description?: string;
  user_comment?: string;
  parent_id?: number | null;
  tags?: string[];
}
