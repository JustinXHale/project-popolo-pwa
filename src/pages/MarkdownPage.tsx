import { pageByPath } from '../features/content/loadContent'
import { PageRenderer } from '../features/content/PageRenderer'

export function MarkdownPage({ path }: { path: string }) {
  const page = pageByPath(path)
  if (!page) {
    return (
      <div className="container section">
        <h1>Page not found</h1>
        <p>Add a Markdown file under content/pages with path: {path}</p>
      </div>
    )
  }
  return <PageRenderer page={page} />
}
