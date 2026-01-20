import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import type { OrgUnit, CreateUnitRequest, UpdateUnitRequest } from '../../types';

interface TypeOption {
  value: string;
  label: string;
}

interface OrgUnitFormProps {
  mode: 'create' | 'edit';
  unit?: OrgUnit;
  parentUnit?: OrgUnit;
  onSubmit: (data: CreateUnitRequest | UpdateUnitRequest) => Promise<void>;
  onCancel: () => void;
  checkCostCenter?: (costCenter: string) => Promise<boolean>;
}

export function OrgUnitForm({
  mode,
  unit,
  parentUnit,
  onSubmit,
  onCancel,
  checkCostCenter
}: OrgUnitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costCenterError, setCostCenterError] = useState<string | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<TypeOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateUnitRequest>({
    defaultValues: mode === 'edit' && unit ? {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      costCenter: unit.costCenter,
      manager: unit.manager || ''
    } : {
      id: '',
      name: '',
      type: '',
      costCenter: '',
      manager: ''
    }
  });

  const costCenter = watch('costCenter');

  // Hamta tillatna typer fran API
  useEffect(() => {
    const fetchAllowedTypes = async () => {
      setTypesLoading(true);
      try {
        if (mode === 'create' && parentUnit) {
          // Hamta tillatna barntyper for foraldern
          const response = await fetch(`/api/organization/types/${parentUnit.type}/allowed-children`);
          const data = await response.json();
          if (data.success && data.data) {
            setAllowedTypes(data.data);
          }
        } else if (mode === 'edit') {
          // Vid redigering, visa enhetens nuvarande typ
          setAllowedTypes([{
            value: unit?.type || '',
            label: unit?.type ? unit.type.charAt(0).toUpperCase() + unit.type.slice(1) : ''
          }]);
        } else {
          // Fallback: hamta alla typer
          const response = await fetch('/api/organization/types');
          const data = await response.json();
          if (data.success && data.data) {
            setAllowedTypes(data.data);
          }
        }
      } catch (error) {
        console.error('Kunde inte hamta enhetstyper:', error);
        // Fallback till standardtyper
        setAllowedTypes([
          { value: 'division', label: 'Division' },
          { value: 'avdelning', label: 'Avdelning' },
          { value: 'stab', label: 'Stab' },
          { value: 'enhet', label: 'Enhet' }
        ]);
      } finally {
        setTypesLoading(false);
      }
    };

    fetchAllowedTypes();
  }, [mode, parentUnit, unit]);

  // Validera costCenter nar anvandaren skriver
  useEffect(() => {
    if (mode === 'create' && costCenter && costCenter.length === 4 && checkCostCenter) {
      const timer = setTimeout(async () => {
        const isAvailable = await checkCostCenter(costCenter);
        if (!isAvailable) {
          setCostCenterError('Kostnadsstalle anvands redan');
        } else {
          setCostCenterError(null);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setCostCenterError(null);
    }
  }, [costCenter, mode, checkCostCenter]);

  const onSubmitForm = async (data: CreateUnitRequest) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit') {
        const updates: UpdateUnitRequest = {
          name: data.name,
          manager: data.manager || undefined,
          costCenter: data.costCenter
        };
        await onSubmit(updates);
      } else {
        await onSubmit(data);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      <div>
        <h3 className="text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {mode === 'create' ? 'Skapa ny enhet' : `Redigera ${unit?.name}`}
        </h3>
        {parentUnit && (
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Under: <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{parentUnit.name}</span>
          </p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ID
          </label>
          <input
            type="text"
            {...register('id', {
              required: 'ID ar obligatoriskt',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'Endast sma bokstaver, siffror och bindestreck'
              }
            })}
            className="input"
            placeholder="t.ex. min-enhet"
          />
          {errors.id && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
              {errors.id.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Namn
        </label>
        <input
          type="text"
          {...register('name', {
            required: 'Namn ar obligatoriskt',
            maxLength: { value: 100, message: 'Max 100 tecken' }
          })}
          className="input"
          placeholder="Enhetens namn"
        />
        {errors.name && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Typ
        </label>
        <select
          {...register('type', { required: 'Typ ar obligatoriskt' })}
          className="input"
          disabled={mode === 'edit' || typesLoading}
        >
          {typesLoading ? (
            <option value="">Laddar...</option>
          ) : allowedTypes.length === 0 ? (
            <option value="">Inga tillatna typer</option>
          ) : (
            <>
              {mode === 'create' && <option value="">Valj typ...</option>}
              {allowedTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </>
          )}
        </select>
        {errors.type && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
            {errors.type.message}
          </p>
        )}
        {allowedTypes.length === 0 && !typesLoading && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-warning)' }}>
            Denna enhetstyp kan inte ha underenheter
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Kostnadsstalle
        </label>
        <input
          type="text"
          {...register('costCenter', {
            required: 'Kostnadsstalle ar obligatoriskt',
            pattern: {
              value: /^\d{4}$/,
              message: 'Maste vara 4 siffror'
            }
          })}
          className="input"
          placeholder="0000"
          maxLength={4}
        />
        {errors.costCenter && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
            {errors.costCenter.message}
          </p>
        )}
        {costCenterError && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
            {costCenterError}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Chef (valfritt)
        </label>
        <input
          type="text"
          {...register('manager', {
            maxLength: { value: 100, message: 'Max 100 tecken' }
          })}
          className="input"
          placeholder="Chefens namn"
        />
        {errors.manager && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
            {errors.manager.message}
          </p>
        )}
      </div>

      <div
        className="flex gap-3 pt-5"
        style={{ borderTop: '2px solid var(--color-border)' }}
      >
        <button
          type="submit"
          disabled={isSubmitting || !!costCenterError || (mode === 'create' && allowedTypes.length === 0)}
          className="btn-primary flex-1"
        >
          {isSubmitting ? 'Sparar...' : mode === 'create' ? 'Skapa' : 'Spara'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-secondary"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
