import type { OrgUnit, UnitTypesConfig } from '../../types';
import { ChevronRight, ChevronDown, Building, Users, Briefcase, Server, Scale, Megaphone, Layers } from 'lucide-react';
import unitTypesConfig from '../../data/unit-types.json';

const config = unitTypesConfig as UnitTypesConfig;

// Ikon-mappning
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building,
  Users,
  Briefcase,
  Server,
  Scale,
  Megaphone,
  Layers
};

// Pre-kompilera regex-mönster vid laddning för bättre prestanda och säkerhet
interface CompiledIconOverride {
  regex: RegExp;
  icon: string;
}

const compiledIconOverrides: CompiledIconOverride[] = [];
if (config.iconOverrides) {
  for (const override of config.iconOverrides) {
    try {
      compiledIconOverrides.push({
        regex: new RegExp(override.pattern, 'i'),
        icon: override.icon
      });
    } catch (error) {
      console.warn(`Ogiltig regex i iconOverrides: ${override.pattern}`, error);
    }
  }
}

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

  // Kolla pre-kompilerade icon overrides först
  for (const override of compiledIconOverrides) {
    if (override.regex.test(id)) {
      return iconMap[override.icon] || Users;
    }
  }

  // Fallback till typ-baserad ikon med null-check
  const typeConfig = config.types?.[unit.type];
  if (typeConfig?.icon) {
    return iconMap[typeConfig.icon] || Users;
  }

  return Users;
}

function getTypeColor(type: string): string {
  const typeConfig = config.types?.[type];
  return typeConfig?.color?.text || 'text-slate-500';
}

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
          <Icon className={`w-4 h-4 ${getTypeColor(unit.type)}`} />
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
