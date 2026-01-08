import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users, Briefcase, Shield, Box } from 'lucide-react';
import type { OrgUnit } from '../../types';

interface OrgTreeEditorProps {
  organization: OrgUnit;
  onSelectUnit: (unit: OrgUnit) => void;
  selectedUnit: OrgUnit | null;
}

export function OrgTreeEditor({ organization, onSelectUnit, selectedUnit }: OrgTreeEditorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([organization.id]));

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getIcon = (type: OrgUnit['type']) => {
    switch (type) {
      case 'koncern':
        return <Building2 className="w-4 h-4" />;
      case 'division':
        return <Briefcase className="w-4 h-4" />;
      case 'avdelning':
        return <Users className="w-4 h-4" />;
      case 'stab':
        return <Shield className="w-4 h-4" />;
      case 'enhet':
        return <Box className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: OrgUnit['type']) => {
    switch (type) {
      case 'koncern':
        return 'text-blue-600';
      case 'division':
        return 'text-emerald-600';
      case 'avdelning':
        return 'text-amber-600';
      case 'stab':
        return 'text-purple-600';
      case 'enhet':
        return 'text-slate-600';
    }
  };

  const renderUnit = (unit: OrgUnit, depth: number = 0) => {
    const isExpanded = expandedNodes.has(unit.id);
    const hasChildren = unit.children && unit.children.length > 0;
    const isSelected = selectedUnit?.id === unit.id;

    return (
      <div key={unit.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded hover:bg-slate-100 transition-colors ${
            isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectUnit(unit)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(unit.id);
              }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className={getTypeColor(unit.type)}>
            {getIcon(unit.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-800 truncate">
              {unit.name}
            </div>
            <div className="text-xs text-slate-500">
              {unit.costCenter}
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {unit.children!.map(child => renderUnit(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {renderUnit(organization)}
    </div>
  );
}
