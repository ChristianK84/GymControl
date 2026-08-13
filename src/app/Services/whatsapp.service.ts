import { Injectable, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api-service';
import { Membresia } from '../Models/membresias';

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  private readonly WHATSAPP_PHONE_CODE = '52';

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('52') && digits.length >= 12) return digits;
    if (digits.length === 10) return `${this.WHATSAPP_PHONE_CODE}${digits}`;
    return digits;
  }

  async enviarRecibo(m: Membresia): Promise<void> {
    const tutorTelefono = m.alumno?.tutor?.telefono;
    if (!tutorTelefono) {
      throw new Error('El tutor no tiene teléfono registrado');
    }

    const phone = this.normalizePhone(tutorTelefono);
    const alumnoNombre = m.alumno
      ? `${m.alumno.nombrecompleto} ${m.alumno.apellido_paterno}`
      : 'el alumno';
    const tipoNombre = m.tipo_membresia?.nombre ?? '';
    const monto = `$${Number(m.costo_real).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    const vigencia = `${this.formatDate(m.fecha_inicio)} al ${this.formatDate(m.fecha_vencimiento)}`;
    const mensaje = encodeURIComponent(
      `Hola, te comparto el recibo de la membresía de ${alumnoNombre}.\n\n` +
      `Tipo: ${tipoNombre}\nMonto: ${monto} MXN\nVigencia: ${vigencia}\n\n` +
      `Katira's Gymnastics`
    );

    const pdfBlob = await firstValueFrom(this.api.descargarReciboMembresia(m.id));
    if (!pdfBlob) throw new Error('No se pudo generar el PDF');

    const fileName = `Recibo_Membresia_${m.id}.pdf`;

    if (isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await navigator.share({ files: [file], title: 'Recibo de membresía', text: 'Recibo adjunto' });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/${phone}?text=${mensaje}`, '_blank');
    }
  }

  private formatDate(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
