'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceType: 'text' as 'url' | 'text' | 'tweet',
    sourceUrl: '',
    sourceText: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/projects/${data.project.id}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">New Project</h1>
        <p className="mt-1 text-gray-600">
          Create a new crypto content project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Bitcoin ETF Launch Analysis"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this project about?"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type *</Label>
              <Select
                value={formData.sourceType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, sourceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text / Article</SelectItem>
                  <SelectItem value="tweet">Tweet / Thread</SelectItem>
                  <SelectItem value="url">URL / Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.sourceType === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL *</Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  placeholder="https://..."
                  value={formData.sourceUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceUrl: e.target.value })
                  }
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sourceText">Source Content *</Label>
                <Textarea
                  id="sourceText"
                  placeholder="Paste your crypto news, tweet, or article here..."
                  rows={8}
                  value={formData.sourceText}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceText: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-gray-500">
                  Paste the crypto content you want to turn into a video clip
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
