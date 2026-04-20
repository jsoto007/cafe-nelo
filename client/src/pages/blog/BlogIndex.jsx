import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function BlogIndex() {
  const { isSpanish } = useLanguage();
  const copy = isSpanish
    ? {
        title: 'Journal de Café Nelo',
        description:
          'Compartimos respuestas utiles sobre el restaurant, recomendaciones y consejos para prepararte para tu proxima visita a Café Nelo en Bronxville, NY.',
        featured: 'Destacado',
        readMore: 'Leer mas ->',
        posts: [
          {
            title: 'Guia de Cuidado de Unas',
            description:
              'Pasos simples para que tu servicio en gel, acrilico o unas naturales se mantenga limpio, brillante y duradero.',
            to: 'aftercare',
          },
          {
            title: 'Preguntas Frecuentes del Restaurant',
            description:
              'Respuestas claras sobre reservas, preparacion, reparaciones, tiempos y lo que puedes esperar en Café Nelo.',
            to: 'faq',
          },
          {
            title: 'Como se crea un set exclusivo',
            description:
              'Una mirada al proceso de preparacion, estructura, forma y acabado de Café Nelo para resultados pulidos y listos para foto.',
            to: 'custom-fine-line',
          },
        ],
      }
    : {
        title: 'Café Nelo Journal',
        description:
          'We use this space to answer common restaurant questions, share dining guidance, and help guests prepare for their next visit to Café Nelo in Bronxville, NY.',
        featured: 'Featured',
        readMore: 'Read more ->',
        posts: [
          {
            title: 'Table Aftercare Guide',
            description:
              'Simple steps to help your gel, acrylic, or natural dining service stay clean, glossy, and long-lasting.',
            to: 'aftercare',
          },
          {
            title: 'Table Restaurant FAQ',
            description: 'Clear answers about booking, prep, repairs, timing, and what to expect at Café Nelo.',
            to: 'faq',
          },
          {
            title: 'How a Signature Table Set Comes Together',
            description:
              "A look at Café Nelo' prep, shaping, structure, and finishing process for polished, photo-ready results.",
            to: 'custom-fine-line',
          },
        ],
      };
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
          Insights
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {copy.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-600">
          {copy.description}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {copy.posts.map((post) => (
          <BlogPreview key={post.to} {...post} featured={copy.featured} readMore={copy.readMore} />
        ))}
      </div>
    </article>
  );
}

function BlogPreview({ title, description, to, featured, readMore }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">{featured}</p>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-black transition hover:underline">
        {readMore}
      </span>
    </Link>
  );
}
