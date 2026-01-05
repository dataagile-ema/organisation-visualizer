import { AppLayout } from './components/Layout/AppLayout';
import { OrgTree } from './components/Organization/OrgTree';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ChildUnitsComparison } from './components/Dashboard/ChildUnitsComparison';
import { useOrganization } from './hooks/useOrganization';
import './index.css';

function App() {
  const {
    organization,
    selectedUnit,
    selectedUnitData,
    expandedNodes,
    breadcrumbs,
    selectUnit,
    toggleNode,
    getUnitData
  } = useOrganization();

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      onBreadcrumbClick={selectUnit}
      sidebar={
        <OrgTree
          organization={organization}
          selectedUnit={selectedUnit}
          expandedNodes={expandedNodes}
          onSelectUnit={selectUnit}
          onToggleNode={toggleNode}
        />
      }
    >
      <div className="space-y-6">
        <Dashboard
          unit={selectedUnit}
          data={selectedUnitData}
        />

        {selectedUnit.children && selectedUnit.children.length > 0 && (
          <ChildUnitsComparison
            unit={selectedUnit}
            getUnitData={getUnitData}
            onSelectUnit={selectUnit}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default App;
