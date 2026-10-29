import Link from 'next/link'
import { brandPath, modelPath } from '@/lib/car-paths'
import { getMakeCounts } from '@/lib/cars-server'

/** Links to every make and its most listed models, so each landing page is reachable. */
export async function BrowseByMake() {
  const makes = await getMakeCounts()
  if (!makes.length) return null

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Browse cars by make and model</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {makes.map((make) => (
          <div key={make.slug}>
            <Link href={brandPath(make.name)} className="text-sm font-semibold text-gray-900 hover:text-gold-700">
              {make.name} <span className="font-normal text-gray-400">({make.count})</span>
            </Link>
            {make.models.length > 0 && (
              <ul className="mt-1.5 space-y-1 text-sm">
                {make.models.slice(0, 5).map((model) => (
                  <li key={model.slug}>
                    <Link href={modelPath(make.name, model)} className="text-gray-600 hover:text-gold-700">
                      {make.name} {model.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
