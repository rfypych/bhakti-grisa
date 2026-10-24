'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Step1WilayahRumah } from './Step1WilayahRumah';
import { Step2Sanitasi } from './Step2Sanitasi';
import { Step3AnggotaKeluarga } from './Step3AnggotaKeluarga';
import { Step4PekaranganUp2k } from './Step4PekaranganUp2k';
import { Step5ReviewSubmit } from './Step5ReviewSubmit';
import { saveKeluargaAction, KeluargaInputData } from '@/actions/keluargaActions';
import { Check, ChevronRight, ChevronLeft, Save, Loader2, Sparkles } from 'lucide-react';

interface MultiStepFormProps {
  storageKey?: string;
  initialWilayahId?: string;
  isPublicResident?: boolean;
  wilayahList?: any[];
  onSuccessRedirect?: string;
}

const defaultInitialData: KeluargaInputData = {
  noKk: '',
  namaKepalaRumahTangga: '',
  alamat: '',
  wilayahId: '',
  latitude: null,
  longitude: null,
  kriteriaRumah: 'SEHAT',
  jambanKeluarga: true,
  jumlahJamban: 1,
  sumberAir: 'SUMUR',
  tempatSampah: true,
  spal: true,
  stikerP4k: false,
  makananPokok: 'BERAS',
  jenisNonBeras: '',
  aktivitasUp2k: false,
  jenisUsahaUp2k: '',
  kegiatanKesling: false,
  anggota: [],
  hatinyaPkk: [],
  industriRumahTangga: [],
};

const STEPS = [
  { id: 1, title: 'Lokasi & Rumah', shortTitle: 'Lokasi' },
  { id: 2, title: 'Sanitasi', shortTitle: 'Sanitasi' },
  { id: 3, title: 'Anggota Keluarga', shortTitle: 'Warga' },
  { id: 4, title: 'Hatinya & UP2K', shortTitle: 'Pekarangan' },
  { id: 5, title: 'Konfirmasi', shortTitle: 'Review' },
];

export function MultiStepForm({
  storageKey = 'simpatik_keluarga_form_draft',
  initialWilayahId = '',
  isPublicResident = false,
  wilayahList = [],
  onSuccessRedirect = '/dashboard/keluarga',
}: MultiStepFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: formData, updateField, clearDraft, isLoaded } = useFormDraft<KeluargaInputData>(
    storageKey,
    {
      ...defaultInitialData,
      wilayahId: initialWilayahId || '',
    }
  );

  // Persist the wizard position together with the draft data, so a cadre
  // interrupted mid-form (very common door-to-door) resumes on the same
  // step after a reload instead of being sent back to step 1.
  const stepStorageKey = `${storageKey}-step`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(stepStorageKey);
      const n = saved ? parseInt(saved, 10) : NaN;
      if (!Number.isNaN(n) && n >= 1 && n <= STEPS.length) {
        setCurrentStep(n);
      }
    } catch {
      // storage unavailable (private mode); wizard still works from step 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(stepStorageKey, String(currentStep));
    } catch {
      // ignore storage failures; the form data draft is unaffected
    }
  }, [currentStep, stepStorageKey]);

  // Step components declare a string-keyed handler; adapt the hook's generic updateField.
  const handleFieldChange = (key: string, val: any) => {
    updateField(key as keyof KeluargaInputData, val);
  };

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (!formData.noKk || formData.noKk.trim().length === 0) {
        setSubmitError('Nomor KK wajib diisi.');
        return;
      }
      if (!formData.namaKepalaRumahTangga || formData.namaKepalaRumahTangga.trim().length === 0) {
        setSubmitError('Nama Kepala Rumah Tangga wajib diisi.');
        return;
      }
      if (!formData.wilayahId) {
        setSubmitError('Pilih kelompok Dasawisma terlebih dahulu.');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setSubmitError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await saveKeluargaAction(formData, isPublicResident);
      if (res.success) {
        clearDraft();
        try {
          window.localStorage.removeItem(stepStorageKey);
        } catch {
          // ignore
        }
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.error || 'Gagal menyimpan data.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="p-12 text-center text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
        <p className="text-sm">Memuat formulir dan memulihkan draft lokal...</p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-xl border border-emerald-200 shadow-sm text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Data Berhasil Disimpan!</h2>
        <p className="text-sm text-stone-600">
          {isPublicResident
            ? 'Terima kasih telah mengisi formulir mandiri. Data Anda berstatus DRAFT dan sedang menunggu persetujuan kader RT/Dasawisma.'
            : 'Data keluarga baru telah tersimpan di pangkalan data SIMPATIK dan langsung terhitung dalam agregasi wilayah.'}
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
            }}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            Isi Keluarga Baru
          </button>
          {!isPublicResident && (
            <button
              type="button"
              onClick={() => router.push(onSuccessRedirect)}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors"
            >
              Lihat Daftar Keluarga
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header & Progress Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            Draft tersimpan otomatis di perangkat
          </span>
          <span className="whitespace-nowrap">
            Langkah {currentStep} dari {STEPS.length}
          </span>
        </div>

        {/* Stepper Steps */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <div
                key={s.id}
                className={`flex flex-col items-center text-center p-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                    : isCompleted
                    ? 'text-emerald-800 font-medium'
                    : 'text-stone-400 font-normal'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 ${
                    isCompleted
                      ? 'bg-emerald-700 text-white'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className="text-[11px] hidden sm:block">{s.title}</span>
                <span className="text-[10px] sm:hidden">{s.shortTitle}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white p-5 sm:p-8 rounded-xl border border-stone-200 shadow-sm">
        {submitError && (
          <div className="p-3 mb-6 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
            {submitError}
          </div>
        )}

        {currentStep === 1 && (
          <Step1WilayahRumah
            formData={formData}
            updateField={handleFieldChange}
            wilayahList={wilayahList}
          />
        )}
        {currentStep === 2 && (
          <Step2Sanitasi formData={formData} updateField={handleFieldChange} />
        )}
        {currentStep === 3 && (
          <Step3AnggotaKeluarga formData={formData} updateField={handleFieldChange} />
        )}
        {currentStep === 4 && (
          <Step4PekaranganUp2k formData={formData} updateField={handleFieldChange} />
        )}
        {currentStep === 5 && (
          <Step5ReviewSubmit formData={formData} isPublicResident={isPublicResident} />
        )}

        {/* Navigation Buttons */}
        <div className="pt-8 mt-8 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-sm"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-md transition-colors shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Data...
                </>
              ) : (
                'Kirim Data Keluarga'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
