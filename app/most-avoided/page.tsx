import MostAvoidedAdditivesPage from './most-avoided-additives';
import summaryData from '@/lib/data/additive-summary.json';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Most Avoided E-Numbers in Norwegian Products | Skaren',
  description: `We analyzed ${summaryData.totalProductsAnalyzed.toLocaleString()} Norwegian grocery products. Discover which E-numbers are most common, and which ones to avoid. Based on real data.`,
  openGraph: {
    title: 'What E-Numbers Are Really in Your Food?',
    description: `Analysis of ${summaryData.totalProductsAnalyzed.toLocaleString()} Norwegian products. See which additives are most common and which to avoid.`,
    type: 'article',
  },
};

export default function Page() {
  return <MostAvoidedAdditivesPage data={summaryData as any} />;
}
