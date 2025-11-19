'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { noteAPI } from '@/lib/api/study3';
import { toast } from 'sonner';
import { BookOpen, Lightbulb, Heart, Save, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: number;
  module_id: number;
  task_id: number | null;
  content: string;
  note_type: 'lesson' | 'reflection' | 'insight';
  created_at: string;
  updated_at: string;
}

interface NotesEditorProps {
  moduleId: number;
  taskId?: number | null;
}

export function NotesEditor({ moduleId, taskId }: NotesEditorProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'lesson' | 'reflection' | 'insight'>('lesson');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [moduleId, taskId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await noteAPI.getNotes(moduleId);
      let filteredNotes = response.data || [];
      
      // Filter by task if specified
      if (taskId) {
        filteredNotes = filteredNotes.filter((n: Note) => n.task_id === taskId);
      }
      
      setNotes(filteredNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!content.trim()) {
      toast.error('Note content is required');
      return;
    }

    setSaving(true);
    try {
      await noteAPI.createNote({
        module_id: moduleId,
        task_id: taskId || undefined,
        content,
        note_type: noteType,
      });

      toast.success('Note saved successfully');
      setContent('');
      loadNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />;
      case 'reflection':
        return <Heart className="h-4 w-4" />;
      case 'insight':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'reflection':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'insight':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Note Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note Type</label>
            <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Lesson Notes
                  </div>
                </SelectItem>
                <SelectItem value="reflection">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Reflection
                  </div>
                </SelectItem>
                <SelectItem value="insight">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Insight
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Write your study notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveNote}
            disabled={saving || !content.trim()}
            className="w-full gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Previous Notes ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Start writing your study notes above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`${getNoteTypeColor(note.note_type)} gap-1.5`}>
                      {getNoteIcon(note.note_type)}
                      {note.note_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
