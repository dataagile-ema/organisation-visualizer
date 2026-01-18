import { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useOrgData } from './hooks/useOrgData';
import { OrgTreeEditor } from './components/OrgTreeEditor/OrgTreeEditor';
import { OrgUnitForm } from './components/OrgUnitForm/OrgUnitForm';
import type { OrgUnit, CreateUnitRequest, UpdateUnitRequest } from './types';

function App() {
  const {
    organization,
    loading,
    error,
    refreshOrganization,
    createUnit,
    updateUnit,
    deleteUnit,
    checkCostCenter
  } = useOrgData();

  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<OrgUnit | null>(null);

  const handleCreateUnit = async (data: CreateUnitRequest | UpdateUnitRequest) => {
    if (!selectedUnit) return;

    try {
      await createUnit(selectedUnit.id, data as CreateUnitRequest);
      setFormMode(null);
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdateUnit = async (data: CreateUnitRequest | UpdateUnitRequest) => {
    if (!selectedUnit) return;

    try {
      await updateUnit(selectedUnit.id, data as UpdateUnitRequest);
      setFormMode(null);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteUnit(deleteConfirm.id);
      setDeleteConfirm(null);
      setSelectedUnit(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Laddar organisation...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Fel uppstod</h2>
          </div>
          <p className="text-slate-600 mb-4">{error || 'Kunde inte ladda organisation'}</p>
          <button
            onClick={refreshOrganization}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Organisation Admin</h1>
            <p className="text-sm text-slate-600">Hantera organisationsstrukturen</p>
          </div>
          <button
            onClick={refreshOrganization}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
          >
            Uppdatera
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Träd */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Organisationsträd</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <OrgTreeEditor
              organization={organization}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedUnit ? (
            <div className="max-w-2xl">
              {/* Unit Info */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedUnit.name}</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedUnit.type.charAt(0).toUpperCase() + selectedUnit.type.slice(1)} •
                      Kostnadsställe: {selectedUnit.costCenter}
                    </p>
                    {selectedUnit.manager && (
                      <p className="text-sm text-slate-600">Chef: {selectedUnit.manager}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormMode('edit')}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Redigera"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {selectedUnit.id !== organization.id && (
                      <button
                        onClick={() => setDeleteConfirm(selectedUnit)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {selectedUnit.children && selectedUnit.children.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Har {selectedUnit.children.length} underenhet{selectedUnit.children.length !== 1 ? 'er' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Åtgärder</h3>
                <button
                  onClick={() => setFormMode('create')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Skapa ny underenhet
                </button>
              </div>

              {/* Form Modal */}
              {formMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <OrgUnitForm
                      mode={formMode}
                      unit={formMode === 'edit' ? selectedUnit : undefined}
                      parentUnit={formMode === 'create' ? selectedUnit : undefined}
                      onSubmit={formMode === 'create' ? handleCreateUnit : handleUpdateUnit}
                      onCancel={() => setFormMode(null)}
                      checkCostCenter={checkCostCenter}
                    />
                  </div>
                </div>
              )}

              {/* Delete Confirmation */}
              {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Bekräfta borttagning
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Är du säker på att du vill ta bort <strong>{deleteConfirm.name}</strong>?
                      {deleteConfirm.children && deleteConfirm.children.length > 0 && (
                        <span className="block mt-2 text-red-600">
                          Denna enhet har {deleteConfirm.children.length} underenheter som också kommer tas bort.
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteUnit}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Ta bort
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <p className="text-lg">Välj en enhet i trädet till vänster</p>
                <p className="text-sm mt-2">för att visa detaljer och åtgärder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
