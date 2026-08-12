import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { GeneratedCertificate, BrandingSettings } from '../types';
import { getCertificateById } from '../lib/storage';

interface VerificationPageProps {
  initialCertId?: string;
  branding: BrandingSettings;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  initialCertId,
  branding,
}) => {
  const [queryId, setQueryId] = useState<string>(initialCertId || '');
  const [foundCert, setFoundCert] = useState<GeneratedCertificate | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialCertId) {
      handleSearchId(initialCertId);
    }
  }, [initialCertId]);

  const handleSearchId = (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    const cert = getCertificateById(idToSearch.trim());
    setFoundCert(cert || null);
    setSearched(true);
  };

  const isRevoked = foundCert?.status === 'revoked';
  const isValid = foundCert && !isRevoked;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-2xl w-full mx-auto space-y-8 pt-8">
        
        {/* Company Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-3.5 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Certificate Verification Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
            BSROCKS <span className="text-slate-500">×</span> SeventhSense
          </h1>
          <p className="text-xs text-slate-400">
            Authenticity and Credential Verification Engine
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Enter Certificate ID or Scan QR Code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. BSR-2026-0001"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchId(queryId)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <button
              onClick={() => handleSearchId(queryId)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Verify Now
            </button>
          </div>
        </div>

        {/* Verification Result State */}
        {searched && (
          <div>
            {/* 1. VALID CERTIFICATE */}
            {isValid && (
              <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">✓ VALID CERTIFICATE</h3>
                    <p className="text-[11px] text-emerald-300">
                      This certificate is authentic and officially issued by BSROCKS × SeventhSense.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Certificate ID</span>
                    <p className="font-mono font-bold text-blue-400 text-sm">{foundCert.certificateNumber}</p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Recipient Name</span>
                    <p className="font-bold text-white text-sm">{foundCert.recipientName}</p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Event Name</span>
                    <p className="font-medium text-slate-200">{foundCert.data['EVENT_NAME'] || 'Event'}</p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Category / Role</span>
                    <p className="font-medium text-slate-200">{foundCert.data['CATEGORY'] || 'Participant'}</p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Issue Date</span>
                    <p className="font-medium text-slate-200">{foundCert.data['DATE'] || '11/08/2026'}</p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Issued By</span>
                    <p className="font-medium text-slate-200">BSROCKS × SeventhSense</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REVOKED CERTIFICATE */}
            {isRevoked && (
              <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-400 uppercase tracking-wider">
                    ⚠ CERTIFICATE REVOKED
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Certificate <span className="font-mono text-white">{foundCert.certificateNumber}</span> was officially revoked by the issuing authority.
                  </p>
                </div>
              </div>
            )}

            {/* 3. NOT FOUND */}
            {!foundCert && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                  ✕ CERTIFICATE NOT FOUND
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No certificate matching ID "<span className="font-mono text-white">{queryId}</span>" could be found in our verification registry. Please double-check the ID.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-slate-600 text-xs">
        BSROCKS × SeventhSense Certificate Printing & Verification System
      </footer>
    </div>
  );
};
