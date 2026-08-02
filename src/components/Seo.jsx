import { Helmet } from 'react-helmet-async';

const BASE = 'https://pccmastery.com';

export default function Seo({ title, description, path, noindex = false }) {
  const full = title ? `${title} | PCC Mastery` : 'PCC Mastery — Practice the Real ICF PCC Exam Format';
  const url = `${BASE}${path || ''}`;
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
