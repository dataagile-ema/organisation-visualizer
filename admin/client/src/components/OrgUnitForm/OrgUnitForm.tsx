import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import type { OrgUnit, CreateUnitRequest, UpdateUnitRequest } from '../../types';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CreateUnitRequest>({
    defaultValues: mode === 'edit' && unit ? {
      id: unit.id,
      name: unit.name,
      type: unit.type as any,
      costCenter: unit.costCenter,
      manager: unit.manager || ''
    } : {
      id: '',
      name: '',
      type: 'enhet',
      costCenter: '',
      manager: ''
    }
  });

  const costCenter = watch('costCenter');

  // Validera costCenter när användaren skriver
  useEffect(() => {
    if (mode === 'create' && costCenter && costCenter.length === 4 && checkCostCenter) {
      const timer = setTimeout(async () => {
        const isAvailable = await checkCostCenter(costCenter);
        if (!isAvailable) {
          setCostCenterError('Kostnadsställe används redan');
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

  const allowedTypes = parentUnit?.type === 'division'
    ? ['stab', 'avdelning', 'enhet']
    : parentUnit?.type === 'avdelning'
    ? ['enhet']
    : ['division', 'enhet'];

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {mode === 'create' ? 'Skapa ny enhet' : `Redigera ${unit?.name}`}
        </h3>
        {parentUnit && (
          <p className="text-sm text-slate-600 mb-4">
            Under: <span className="font-medium">{parentUnit.name}</span>
          </p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ID
          </label>
          <input
            type="text"
            {...register('id', {
              required: 'ID är obligatoriskt',
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: 'Endast små bokstäver, siffror och bindestreck'
              }
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="t.ex. min-enhet"
          />
          {errors.id && (
            <p className="text-sm text-red-600 mt-1">{errors.id.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Namn
        </label>
        <input
          type="text"
          {...register('name', {
            required: 'Namn är obligatoriskt',
            maxLength: { value: 100, message: 'Max 100 tecken' }
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enhetens namn"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Typ
        </label>
        <select
          {...register('type', { required: 'Typ är obligatoriskt' })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={mode === 'edit'}
        >
          {allowedTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Kostnadsställe
        </label>
        <input
          type="text"
          {...register('costCenter', {
            required: 'Kostnadsställe är obligatoriskt',
            pattern: {
              value: /^\d{4}$/,
              message: 'Måste vara 4 siffror'
            }
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0000"
          maxLength={4}
        />
        {errors.costCenter && (
          <p className="text-sm text-red-600 mt-1">{errors.costCenter.message}</p>
        )}
        {costCenterError && (
          <p className="text-sm text-red-600 mt-1">{costCenterError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Chef (valfritt)
        </label>
        <input
          type="text"
          {...register('manager', {
            maxLength: { value: 100, message: 'Max 100 tecken' }
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Chefens namn"
        />
        {errors.manager && (
          <p className="text-sm text-red-600 mt-1">{errors.manager.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting || !!costCenterError}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Sparar...' : mode === 'create' ? 'Skapa' : 'Spara'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
