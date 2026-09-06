import { useEffect, useState } from 'react';

import { ApiError } from '../../../lib/api/client';
import { formatDate } from '../../../lib/date';
import { createTaskNote, getTaskNotes } from '../api';
import type { TaskNote } from '../types';

type TaskNotesProps = {
  taskId: string;
  canAdd: boolean;
};

export function TaskNotes({ taskId, canAdd }: TaskNotesProps) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getTaskNotes(taskId)
      .then(setNotes)
      .catch((requestError: unknown) => {
        console.error(requestError);
        setError(requestError instanceof ApiError ? requestError.message : 'No pudimos cargar las notas.');
      })
      .finally(() => setIsLoading(false));
  }, [taskId]);

  const handleSubmit = async (): Promise<void> => {
    if (!content.trim()) {
      setError('Escribe una nota antes de guardarla.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const note = await createTaskNote(taskId, content);
      setNotes((currentNotes) => [...currentNotes, note]);
      setContent('');
      setIsFormOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof ApiError ? requestError.message : 'No pudimos guardar la nota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="task-notes">
      <div className="task-notes-heading">
        <p className="task-detail-description-label">Notas</p>
        {canAdd && (
          <button type="button" className="task-notes-add-button" onClick={() => setIsFormOpen((open) => !open)}>
            + Agregar nota
          </button>
        )}
      </div>
      {isFormOpen && (
        <div className="task-note-form">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Escribe una nota..."
            rows={3}
            maxLength={5000}
            aria-label="Contenido de la nota"
          />
          <div className="task-note-form-actions">
            <button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
            <button type="button" className="primary-button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {isLoading ? <p className="empty-state">Cargando notas...</p> : notes.length === 0 ? (
        <p className="empty-state">Aún no hay notas.</p>
      ) : (
        <ul className="task-notes-list">
          {notes.map((note) => (
            <li key={note.id} className="task-note-item">
              <p>{note.content}</p>
              <small>{note.author.name} · {formatDate(note.createdAt)}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
