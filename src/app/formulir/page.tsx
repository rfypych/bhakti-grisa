import React from 'react';
import { prisma } from '@/lib/prisma';
import { MultiStepForm } from '@/components/form/MultiStepForm';

export const metadata = {
  title: 'Formulir Pendataan Keluarga - SIMPATIK',
};

export default async function FormulirPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; role?: string }>;
}) {
  const resolvedParams = await searchParams; // Next 16 convention

  const wilayahList = await prisma.wilayah.findMany({
    orderBy: [{ rt: 'asc' }],
  });

  const isPublic = resolvedParams.role !== 'kader';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <MultiStepForm
        initialWilayahId={resolvedParams.wilayahId}
        wilayahList={wilayahList}
        isPublicResident={isPublic}
      />
    </div>
  );
}
