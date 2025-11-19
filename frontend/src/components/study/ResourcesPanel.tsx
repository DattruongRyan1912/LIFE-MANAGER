'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { recommendationAPI } from '@/lib/api/study3';
import { toast } from 'sonner';
import { ExternalLink, BookOpen, Video, FileText, Link as LinkIcon } from 'lucide-react';

interface Resource {
  id: number;
  goal_id: number;
  module_id: number;
  title: string;
  url: string;
  reason: string;
  created_at: string;
}

interface ResourcesPanelProps {
  moduleId: number;
}

export function ResourcesPanel({ moduleId }: ResourcesPanelProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResources();
  }, [moduleId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await recommendationAPI.getResources(moduleId);
      setResources(response.data || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('Failed to load resource suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (url: string) => {
    if (url.includes('youtube') || url.includes('video')) {
      return <Video className="h-4 w-4 text-red-500" />;
    } else if (url.includes('pdf') || url.includes('doc')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else {
      return <BookOpen className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-500" />
          Recommended Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No resources yet</p>
            <p className="text-sm mt-1">
              AI will suggest relevant learning materials as you progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border rounded-lg p-4 hover:border-primary hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getResourceIcon(resource.url)}</div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm group-hover:text-primary">
                        {resource.title}
                      </h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {resource.reason}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Badge variant="secondary" className="text-xs">
                        AI Recommended
                      </Badge>
                      <span className="truncate">{new URL(resource.url).hostname}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
