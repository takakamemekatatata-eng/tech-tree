export interface Relation {
  id: number;
  from_node_id: number;
  to_node_id: number;
  relation_type: string;
  strength?: number;
  from_node?: { id: number };
  to_node?: { id: number };
}
