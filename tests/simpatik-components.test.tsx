import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  BoardLogo,
  BoardButton,
  BoardStatCard,
  BoardChip,
  BoardSegmentedControl,
  BoardAvatar,
  BoardBadge,
  BoardKbd,
  BoardBreadcrumb,
  BoardBreadcrumbItem,
  BoardSurface,
  BoardCallout,
  BoardStatusLabel,
  BoardEmptyState,
} from '../src/components/simpatik';

describe('SIMPATIK Component Library', () => {
  describe('BoardLogo', () => {
    it('renders circular BoardLogo with electric gradient and ring', () => {
      const html = renderToString(<BoardLogo size={32} rounded="circle" />);
      expect(html).toContain('rounded-full');
      expect(html).toContain('bg-button-primary');
      expect(html).toContain('text-white');
      expect(html).toContain('width:32px');
      expect(html).toContain('height:32px');
    });

    it('renders square BoardLogo with rounded corners', () => {
      const html = renderToString(<BoardLogo size={24} rounded="square" />);
      expect(html).toContain('rounded-[8px]');
      expect(html).toContain('width:24px');
    });
  });

  describe('BoardButton', () => {
    it('renders primary variant with button-press-motion and shadow-xs', () => {
      const html = renderToString(
        <BoardButton variant="primary" size="md">
          Simpan Data
        </BoardButton>
      );
      expect(html).toContain('bg-button-primary');
      expect(html).toContain('text-text-white');
      expect(html).toContain('button-press-motion');
      expect(html).toContain('shadow-xs');
      expect(html).toContain('Simpan Data');
    });

    it('renders secondary variant with neutral border and hover state', () => {
      const html = renderToString(
        <BoardButton variant="secondary" size="lg">
          Batal
        </BoardButton>
      );
      expect(html).toContain('bg-background-primary-default');
      expect(html).toContain('border-border-button-default');
      expect(html).toContain('text-text-primary');
      expect(html).toContain('Batal');
    });

    it('renders ghost and danger variants properly', () => {
      const ghostHtml = renderToString(
        <BoardButton variant="ghost">Bantuan</BoardButton>
      );
      expect(ghostHtml).toContain('bg-button-ghost-background');
      expect(ghostHtml).toContain('text-button-ghost-foreground');

      const dangerHtml = renderToString(
        <BoardButton variant="danger">Hapus</BoardButton>
      );
      expect(dangerHtml).toContain('bg-button-danger');
      expect(dangerHtml).toContain('text-text-white');
    });

    it('handles disabled attribute', () => {
      const html = renderToString(
        <BoardButton variant="primary" disabled>
          Memproses...
        </BoardButton>
      );
      expect(html).toContain('disabled=""');
      expect(html).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('BoardStatCard', () => {
    it('renders SIMPATIK FooterStatCard structure with headline and inner white band', () => {
      const html = renderToString(
        <BoardStatCard
          label="Total Kepala Keluarga"
          value="1,248"
          subtext="Data Dasawisma Terverifikasi"
          accentTone="default"
        />
      );
      expect(html).toContain('Total Kepala Keluarga');
      expect(html).toContain('1,248');
      expect(html).toContain('Data Dasawisma Terverifikasi');
      expect(html).toContain('rounded-2xl');
      expect(html).toContain('bg-background-secondary-default');
      expect(html).toContain('bg-background-inner-default');
      expect(html).toContain('shadow-card');
      expect(html).toContain('bg-status-lime-background');
      expect(html).toContain('text-status-lime-text');
    });

    it('applies crimson and amber accent tones correctly', () => {
      const crimsonHtml = renderToString(
        <BoardStatCard
          label="Balita Stunting"
          value="3"
          accentTone="crimson"
          deltaLabel="Perlu Intervensi"
        />
      );
      expect(crimsonHtml).toContain('bg-status-rose-background');
      expect(crimsonHtml).toContain('text-status-rose-text');
      expect(crimsonHtml).toContain('Perlu Intervensi');

      const amberHtml = renderToString(
        <BoardStatCard
          label="Ibu Hamil Risti"
          value="5"
          accentTone="amber"
          deltaLabel="Pantau Rutin"
        />
      );
      expect(amberHtml).toContain('bg-status-yellow-background');
      expect(amberHtml).toContain('text-status-yellow-text');
      expect(amberHtml).toContain('Pantau Rutin');
    });
  });

  describe('BoardChip', () => {
    it('renders bold status chips with respective color tokens', () => {
      const limeChip = renderToString(
        <BoardChip variant="bold" color="lime">
          Aktif
        </BoardChip>
      );
      expect(limeChip).toContain('bg-status-lime-background');
      expect(limeChip).toContain('text-status-lime-text');
      expect(limeChip).toContain('text-body-medium');

      const roseChip = renderToString(
        <BoardChip variant="bold" color="rose">
          Ditolak
        </BoardChip>
      );
      expect(roseChip).toContain('bg-status-rose-background');
      expect(roseChip).toContain('text-status-rose-text');

      const yellowChip = renderToString(
        <BoardChip variant="caption" color="yellow">
          Menunggu
        </BoardChip>
      );
      expect(yellowChip).toContain('bg-status-yellow-background');
      expect(yellowChip).toContain('text-status-yellow-text');
      expect(yellowChip).toContain('text-caption-1-medium');
    });
  });

  describe('BoardSegmentedControl', () => {
    it('renders segmented control options with active selection styling', () => {
      const options = [
        { value: 'semua', label: 'Semua Data', count: 42 },
        { value: 'aktif', label: 'Aktif', count: 38 },
        { value: 'arsip', label: 'Arsip', count: 4 },
      ];
      const html = renderToString(
        <BoardSegmentedControl
          options={options}
          value="aktif"
          onChange={() => {}}
        />
      );
      expect(html).toContain('bg-segmented-control-background');
      expect(html).toContain('bg-segmented-control-selected-background');
      expect(html).toContain('shadow-2xs');
      expect(html).toContain('Semua Data');
      expect(html).toContain('Aktif');
      expect(html).toContain('42');
    });
  });

  describe('Other SIMPATIK Components', () => {
    it('renders BoardAvatar with size and color mapping', () => {
      const html = renderToString(
        <BoardAvatar size="md" color="lime" initials="BG" />
      );
      expect(html).toContain('bg-lime-200');
      expect(html).toContain('text-lime-700');
      expect(html).toContain('BG');
    });

    it('renders BoardBadge with caption typography', () => {
      const html = renderToString(<BoardBadge color="primary">Baru</BoardBadge>);
      expect(html).toContain('bg-accent-400');
      expect(html).toContain('text-white');
      expect(html).toContain('Baru');
    });

    it('renders BoardKbd shortcut pill', () => {
      const html = renderToString(<BoardKbd>⌘K</BoardKbd>);
      expect(html).toContain('bg-kbd-background');
      expect(html).toContain('text-kbd-foreground');
      expect(html).toContain('⌘K');
    });

    it('renders BoardSurface container variants', () => {
      const html = renderToString(
        <BoardSurface variant="default" padding="lg">
          Konten Permukaan
        </BoardSurface>
      );
      expect(html).toContain('bg-background-primary-default');
      expect(html).toContain('border-border-table');
      expect(html).toContain('rounded-2xl');
      expect(html).toContain('p-6 sm:p-7');
    });

    it('renders BoardCallout with info, warning, or danger tone', () => {
      const html = renderToString(
        <BoardCallout
          tone="info"
          title="Sinkronisasi Berhasil"
          description="Data Dasawisma telah dimutakhirkan ke cloud."
        />
      );
      expect(html).toContain('Sinkronisasi Berhasil');
      expect(html).toContain('bg-background-secondary-default');
    });

    it('renders BoardStatusLabel chip shortcut', () => {
      const html = renderToString(
        <BoardStatusLabel tone="nominal" label="Terverifikasi" />
      );
      expect(html).toContain('Terverifikasi');
      expect(html).toContain('bg-status-lime-background');
    });

    it('renders BoardEmptyState with icon and message', () => {
      const html = renderToString(
        <BoardEmptyState
          title="Belum Ada Laporan"
          description="Tidak ditemukan riwayat peristiwa bulan ini."
        />
      );
      expect(html).toContain('Belum Ada Laporan');
      expect(html).toContain('bg-background-secondary-default');
    });
  });
});
