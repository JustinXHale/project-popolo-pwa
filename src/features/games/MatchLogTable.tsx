import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import {
  DOCUMENT_TYPE_LABELS,
  MATCH_FORMAT_LABELS,
  MATCH_GENDER_LABELS,
  REFEREE_POSITION_LABELS,
  evaluationForGame,
  formatGameClassification,
  formatsInLog,
  type DocumentDoc,
  type GameDoc,
  type MatchFormat,
} from '../../types/models'

export function MatchLogTable({
  games,
  documents,
  onRemove,
  emptyLabel = 'No published appointments yet.',
}: {
  games: GameDoc[]
  documents: DocumentDoc[]
  onRemove?: (id: string) => void
  emptyLabel?: string
}) {
  const formats = formatsInLog(games)
  const [filter, setFilter] = useState<MatchFormat | 'all'>('all')
  const rows =
    filter === 'all' ? games : games.filter((game) => game.format === filter)

  if (games.length === 0) {
    return <p>{emptyLabel}</p>
  }

  return (
    <div>
      {formats.length > 1 ? (
        <div
          className="format-filters"
          role="group"
          aria-label="Filter match log by format"
        >
          <Button
            type="button"
            size="sm"
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          {formats.map((format) => (
            <Button
              key={format}
              type="button"
              size="sm"
              variant={filter === format ? 'primary' : 'secondary'}
              onClick={() => setFilter(format)}
            >
              {MATCH_FORMAT_LABELS[format]}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Date</th>
              <th>Location</th>
              <th>Format</th>
              <th>Gender</th>
              <th>Type / level</th>
              <th>Role</th>
              <th>Footage</th>
              <th>Evaluation</th>
              {onRemove ? <th></th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((game) => {
              const evaluation = evaluationForGame(game, documents)
              const evalLabel =
                game.evaluatorName ||
                evaluation?.title ||
                (evaluation ? DOCUMENT_TYPE_LABELS[evaluation.type] : '')
              return (
                <tr key={game.id}>
                  <td>{game.tournamentName}</td>
                  <td>{game.date}</td>
                  <td>{game.location || '—'}</td>
                  <td>{MATCH_FORMAT_LABELS[game.format]}</td>
                  <td>
                    {game.gender ? MATCH_GENDER_LABELS[game.gender] : '—'}
                  </td>
                  <td>{formatGameClassification(game)}</td>
                  <td>{REFEREE_POSITION_LABELS[game.role]}</td>
                  <td>
                    {game.footageUrl ? (
                      <a href={game.footageUrl} target="_blank" rel="noreferrer">
                        Watch
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {evaluation ? (
                      <a
                        href={evaluation.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {evalLabel}
                      </a>
                    ) : evalLabel ? (
                      evalLabel
                    ) : (
                      '—'
                    )}
                  </td>
                  {onRemove ? (
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(game.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
