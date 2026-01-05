import type { OrgUnit } from '../../types';
import { ChevronRight, ChevronDown, Building, Users, Briefcase, Server, Scale, Megaphone } from 'lucide-react';

interface OrgNodeProps {
  unit: OrgUnit;
  selectedUnit: OrgUnit;
  expandedNodes: Set<string>;
  onSelectUnit: (unit: OrgUnit) => void;
  onToggleNode: (nodeId: string) => void;
  level: number;
}

function getIconForUnit(unit: OrgUnit) {
  const id = unit.id.toLowerCase();

  // Specifika ikoner baserat på enhetens ID
  if (id.includes('ekonomi') || id.includes('treasury') || id.includes('redovisning') || id.includes('controlling')) {
    return Scale;
  }
  if (id.includes('hr') || id.includes('personal') || id.includes('rekrytering') || id.includes('kompetensutveckling') || id.includes('arbetsratt')) {
    return Users;
  }
  if (id.includes('it') || id.includes('infrastruktur') || id.includes('applikationer') || id.includes('support')) {
    return Server;
  }
  if (id.includes('kommunikation') || id.includes('marknad')) {
    return Megaphone;
  }
  if (id.includes('juridik')) {
    return Scale;
  }

  // Baserat på typ
  switch (unit.type) {
    case 'koncern':
      return Building;
    case 'division':
      return Briefcase;
    case 'stab':
      return Briefcase;
    default:
      return Users;
  }
}

const typeColors: Record<string, string> = {
  koncern: 'text-blue-600',
  division: 'text-emerald-600',
  avdelning: 'text-amber-600',
  enhet: 'text-slate-500',
  stab: 'text-purple-600'
};

export function OrgNode({
  unit,
  selectedUnit,
  expandedNodes,
  onSelectUnit,
  onToggleNode,
  level
}: OrgNodeProps) {
  const hasChildren = unit.children && unit.children.length > 0;
  const isExpanded = expandedNodes.has(unit.id);
  const isSelected = selectedUnit.id === unit.id;
  const Icon = getIconForUnit(unit);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-100 text-blue-800'
            : 'hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleNode(unit.id);
          }}
          className={`w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 ${
            !hasChildren ? 'invisible' : ''
          }`}
        >
          {hasChildren && (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-slate-500" />
              : <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Unit button */}
        <button
          onClick={() => onSelectUnit(unit)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <Icon className={`w-4 h-4 ${typeColors[unit.type] || 'text-slate-500'}`} />
          <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
            {unit.name}
          </span>
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {unit.children!.map(child => (
            <OrgNode
              key={child.id}
              unit={child}
              selectedUnit={selectedUnit}
              expandedNodes={expandedNodes}
              onSelectUnit={onSelectUnit}
              onToggleNode={onToggleNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
