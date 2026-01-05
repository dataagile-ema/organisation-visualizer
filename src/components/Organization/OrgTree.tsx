import type { OrgUnit } from '../../types';
import { OrgNode } from './OrgNode';

interface OrgTreeProps {
  organization: OrgUnit;
  selectedUnit: OrgUnit;
  expandedNodes: Set<string>;
  onSelectUnit: (unit: OrgUnit) => void;
  onToggleNode: (nodeId: string) => void;
}

export function OrgTree({
  organization,
  selectedUnit,
  expandedNodes,
  onSelectUnit,
  onToggleNode
}: OrgTreeProps) {
  return (
    <div className="select-none">
      <OrgNode
        unit={organization}
        selectedUnit={selectedUnit}
        expandedNodes={expandedNodes}
        onSelectUnit={onSelectUnit}
        onToggleNode={onToggleNode}
        level={0}
      />
    </div>
  );
}
