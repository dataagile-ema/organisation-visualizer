import { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Laddar organisation...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="card p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4" style={{ color: 'var(--color-error)' }}>
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Fel uppstod</h2>
          </div>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {error || 'Kunde inte ladda organisation'}
          </p>
          <button onClick={refreshOrganization} className="btn-primary">
            Forsok igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="px-6 py-4"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-border)'
        }}
      >
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Organisation Admin
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Hantera organisationsstrukturen
            </p>
          </div>
          <button
            onClick={refreshOrganization}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Uppdatera
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-85px)]">
        {/* Sidebar - Trad */}
        <div
          className="w-80 overflow-hidden flex flex-col"
          style={{
            background: 'var(--color-surface)',
            borderRight: '2px solid var(--color-border)'
          }}
        >
          <div
            className="p-4"
            style={{ borderBottom: '2px solid var(--color-border)' }}
          >
            <h2 className="text-lg" style={{ color: 'var(--color-text-primary)' }}>
              Organisationstrad
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <OrgTreeEditor
              organization={organization}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedUnit ? (
            <div className="max-w-2xl">
              {/* Unit Info */}
              <div className="card p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedUnit.name}
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                      <span className={`type-${selectedUnit.type}`}>
                        {selectedUnit.type.charAt(0).toUpperCase() + selectedUnit.type.slice(1)}
                      </span>
                      {' '}&bull;{' '}
                      Kostnadsstalle: <span style={{ color: 'var(--color-accent)' }}>{selectedUnit.costCenter}</span>
                    </p>
                    {selectedUnit.manager && (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        Chef: {selectedUnit.manager}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormMode('edit')}
                      className="p-2 transition-colors"
                      style={{
                        color: 'var(--color-text-muted)',
                        border: '2px solid var(--color-border)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-accent)';
                        e.currentTarget.style.color = 'var(--color-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                      }}
                      title="Redigera"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {selectedUnit.id !== organization.id && (
                      <button
                        onClick={() => setDeleteConfirm(selectedUnit)}
                        className="p-2 transition-colors"
                        style={{
                          color: 'var(--color-error)',
                          border: '2px solid var(--color-border)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-error)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                        title="Ta bort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {selectedUnit.children && selectedUnit.children.length > 0 && (
                  <div
                    className="pt-4 mt-4"
                    style={{ borderTop: '2px solid var(--color-border)' }}
                  >
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                      Har <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                        {selectedUnit.children.length}
                      </span> underenhet{selectedUnit.children.length !== 1 ? 'er' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card p-6">
                <h3 className="text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Atgarder
                </h3>
                <button
                  onClick={() => setFormMode('create')}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Skapa ny underenhet
                </button>
              </div>

              {/* Form Modal */}
              {formMode && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
                  <div className="card p-6 max-w-md w-full">
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
                <div className="fixed inset-0 modal-overlay flex items-center justify-center p-4 z-50">
                  <div className="card p-6 max-w-md w-full">
                    <h3 className="text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      Bekrafta borttagning
                    </h3>
                    <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                      Ar du saker pa att du vill ta bort{' '}
                      <strong style={{ color: 'var(--color-text-primary)' }}>{deleteConfirm.name}</strong>?
                      {deleteConfirm.children && deleteConfirm.children.length > 0 && (
                        <span className="block mt-3" style={{ color: 'var(--color-error)' }}>
                          Denna enhet har {deleteConfirm.children.length} underenheter som ocksa kommer tas bort.
                        </span>
                      )}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteUnit}
                        className="btn-danger flex-1"
                      >
                        Ta bort
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn-secondary"
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
              <div className="text-center" style={{ color: 'var(--color-text-muted)' }}>
                <p className="text-xl mb-2">Valj en enhet i tradet till vanster</p>
                <p style={{ fontSize: '0.95rem' }}>for att visa detaljer och atgarder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
