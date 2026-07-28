import MostAvoidedAdditivesPage from '../most-avoided/most-avoided-additives';
import summaryData from '@/lib/data/additive-summary.json';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'De mest unngåtte E-numrene i norske produkter | Skaren',
  description: `Vi analyserte ${summaryData.totalProductsAnalyzed.toLocaleString()} norske dagligvareprodukter. Oppdag hvilke E-numre som er mest vanlige, og hvilke du bør unngå. Basert på ekte data.`,
  openGraph: {
    title: 'Hva er egentlig i maten din?',
    description: `Analyse av ${summaryData.totalProductsAnalyzed.toLocaleString()} norske produkter. Se hvilke tilsetningsstoffer som er mest vanlige og hvilke du bør unngå.`,
    type: 'article',
  },
};

export default function Page() {
  return <MostAvoidedAdditivesPage data={summaryData as any} lang="no" />;
}
