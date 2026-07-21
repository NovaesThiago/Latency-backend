export type Route = 'NORTE' | 'CENTRAL' | 'SUL';
export type SubrouteType = 'TREINAMENTO' | 'DIRETA';
export type UnitStatus = 'VIVA' | 'MORTA';

export interface MapNodeData {
  id: string;
  route: Route;
  subrouteType: SubrouteType;
  positionIndex: number;
  connections: string[];
}

export interface GeneratedMap {
  templateId: string;
  seed: string;
  nodes: MapNodeData[];
}
