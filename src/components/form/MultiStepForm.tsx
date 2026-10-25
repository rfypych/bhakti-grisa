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
import { Check, ChevronRight, ChevronLeft, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

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
  { id: 1, title: 'Wilayah & Lokasi Rumah', shortTitle: 'Lokasi' },
  { id: 2, title: 'Sanitasi & Lingkungan', shortTitle: 'Sanitasi' },
  { id: 3, title: 'Anggota Keluarga', shortTitle: 'Warga' },
  { id: 4, title: 'Pekarangan & UP2K', shortTitle: 'Pekarangan' },
  { id: 5, title: 'Ringkasan & Konfirmasi', shortTitle: 'Konfirmasi' },
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

  const stepStorageKey = `${storageKey}-step`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(stepStorageKey);
      const n = saved ? parseInt(saved, 10) : NaN;
      if (!Number.isNaN(n) && n >= 1 && n <= STEPS.length) {
        setCurrentStep(n);
      }
    } catch {
      // storage unavailable
    }
  }, [stepStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(stepStorageKey, String(currentStep));
    } catch {
      // ignore
    }
  }, [currentStep, stepStorageKey]);

  const handleFieldChange = (key: string, val: any) => {
    updateField(key as keyof KeluargaInputData, val);
  };

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (!formData.noKk || formData.noKk.trim().length === 0) {
        setSubmitError('Nomor Kartu Keluarga wajib diisi.');
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
        setSubmitError(res.error || 'Gagal menyimpan data keluarga.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi gangguan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card className="p-12 text-center text-muted-foreground my-8">
        <Loader2 className="size-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-base font-medium text-foreground">Memuat formulir dan memulihkan draft lokal...</p>
      </Card>
    );
  }

  if (submitSuccess) {
    return (
      <Card className="max-w-xl mx-auto my-8 border-primary/30 shadow-md">
        <CardHeader className="text-center p-8 pb-4 space-y-2">
          <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-foreground">
            Data Keluarga Berhasil Disimpan
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            {isPublicResident
              ? 'Terima kasih telah mengisi formulir mandiri. Data Anda kini berstatus DRAFT dan sedang menunggu pemeriksaan oleh Kader Dasawisma RT setempat.'
              : 'Data keluarga baru telah tersimpan di pangkalan data SIMPATIK dan langsung terhitung dalam rekapitulasi resmi desa.'}
          </CardDescription>
        </CardHeader>

        <CardFooter className="p-8 pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
            }}
            className="w-full sm:w-auto min-h-touch text-base"
          >
            Isi Formulir Keluarga Baru
          </Button>

          {!isPublicResident && (
            <Button
              type="button"
              size="default"
              onClick={() => router.push(onSuccessRedirect)}
              className="w-full sm:w-auto min-h-touch text-base"
            >
              Lihat Daftar Keluarga
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  const currentStepInfo = STEPS[currentStep - 1];
  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Wizard Header & Progress Bar */}
      <Card className="p-5 sm:p-6 shadow-sm border-border">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <span className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
              <Save className="size-4 shrink-0" />
              <span>Draft tersimpan otomatis di perangkat</span>
            </span>

            {/* Progres berbunyi kata persis sesuai brief */}
            <span className="text-sm font-bold text-foreground">
              Langkah {currentStep} dari {STEPS.length} : {currentStepInfo.title}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <Progress value={progressPercent} className="h-2.5" />
          </div>

          {/* Stepper Step Tabs (Large touch targets) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-2">
            {STEPS.map((s) => {
              const isCompleted = s.id < currentStep;
              const isCurrent = s.id === currentStep;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (s.id < currentStep) {
                      setSubmitError(null);
                      setCurrentStep(s.id);
                    }
                  }}
                  disabled={s.id > currentStep}
                  className={`flex flex-col items-center text-center p-2 rounded-md transition-colors min-h-[56px] justify-center select-none ${
                    isCurrent
                      ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                      : isCompleted
                      ? 'text-primary hover:bg-secondary cursor-pointer'
                      : 'text-muted-foreground opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="size-3.5" /> : s.id}
                  </div>
                  <span className="text-xs font-semibold hidden md:block">{s.title}</span>
                  <span className="text-xs font-semibold md:hidden">{s.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Step Content Container */}
      <Card className="p-6 sm:p-8 shadow-sm border-border">
        {submitError && (
          <div
            role="alert"
            className="p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2.5 text-destructive text-sm font-medium"
          >
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <span className="leading-normal">{submitError}</span>
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

        {/* Navigation Buttons (48px touch targets, plain verb + object labels) */}
        <div className="pt-8 mt-8 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="min-h-touch text-base"
          >
            <ChevronLeft className="size-5" data-icon="inline-start" />
            <span>Kembali ke Langkah Sebelumnya</span>
          </Button>

          {currentStep < 5 ? (
            <Button
              type="button"
              size="default"
              onClick={handleNext}
              className="min-h-touch text-base"
            >
              <span>Lanjut ke Langkah Berikutnya</span>
              <ChevronRight className="size-5" data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              type="button"
              size="default"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-h-touch text-base font-bold bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" data-icon="inline-start" />
                  <span>Menyimpan Data Keluarga...</span>
                </>
              ) : (
                <>
                  <Check className="size-5" data-icon="inline-start" />
                  <span>Kirim Data Keluarga</span>
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
