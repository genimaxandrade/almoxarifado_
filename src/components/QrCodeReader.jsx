import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, X } from 'lucide-react';

/**
 * Leitor de QR Code pela câmera.
 * Ao ler um código, chama onScan(valor).
 */
export function QrCodeReader({ onScan, onClose }) {
  const [scanner, setScanner] = useState(null);
  const [erro, setErro] = useState('');
  const [started, setStarted] = useState(false);
  const containerRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const iniciar = async () => {
      try {
        const qr = new Html5Qrcode('qr-reader-box');
        setScanner(qr);
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        await qr.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (startedRef.current) return; // previne leituras duplicadas
            startedRef.current = true;
            qr.stop().catch(() => {});
            if (!cancelled) {
              onScan(decodedText);
              onClose && onClose();
            }
          },
          () => {} // ignora falhas de leitura contínuas
        );
        if (!cancelled) setStarted(true);
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao iniciar câmera:', err);
          setErro(
            'Não foi possível acessar a câmera. Verifique se o navegador tem permissão e se o site está em HTTPS.'
          );
        }
      }
    };

    iniciar();

    return () => {
      cancelled = true;
      if (scanner && startedRef.current) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = async () => {
    try {
      if (scanner && startedRef.current) {
        await scanner.stop();
      }
    } catch (e) {}
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:hidden">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Aponte a câmera para o QR Code
          </h3>
          <Button type="button" onClick={handleClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-black rounded-md overflow-hidden">
          <div id="qr-reader-box" className="w-full" />
        </div>

        {erro && (
          <p className="text-sm text-red-300 bg-red-900/50 border border-red-700 rounded p-2">{erro}</p>
        )}

        <p className="text-xs text-gray-400 text-center">
          {started ? 'Posicione o QR Code dentro do quadrado.' : 'Iniciando câmera...'}
        </p>
      </div>
    </div>
  );
}
