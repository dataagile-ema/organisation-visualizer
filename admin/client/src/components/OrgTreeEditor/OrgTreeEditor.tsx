import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users, Briefcase, Shield, Box, Layers } from 'lucide-react';
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
      case 'sektion':
        return <Layers className="w-4 h-4" />;
    }
  };

  const renderUnit = (unit: OrgUnit, depth: number = 0) => {
    const isExpanded = expandedNodes.has(unit.id);
    const hasChildren = unit.children && unit.children.length > 0;
    const isSelected = selectedUnit?.id === unit.id;

    return (
      <div key={unit.id}>
        <div
          className="flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors"
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            background: isSelected ? 'var(--color-accent-light)' : 'transparent',
            borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'var(--color-section-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
          onClick={() => onSelectUnit(unit)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(unit.id);
              }}
              className="p-0.5 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className={`type-${unit.type}`}>
            {getIcon(unit.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="font-medium text-sm truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {unit.name}
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
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
