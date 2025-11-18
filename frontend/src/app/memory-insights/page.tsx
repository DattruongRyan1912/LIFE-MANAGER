"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Database, TrendingUp, Calendar, Tag, Trash2 } from "lucide-react";

interface Memory {
  id: number;
  key: string;
  content: string;
  category: string;
  relevance_score: number;
  last_accessed_at: string;
  created_at: string;
  metadata?: any;
}

interface MemoryStats {
  total: number;
  by_category: Record<string, number>;
  recent_count: number;
  high_relevance_count: number;
}

export default function MemoryInsightsPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Memory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const categories = [
    { value: "all", label: "All Categories", color: "bg-gray-500" },
    { value: "preferences", label: "Preferences", color: "bg-blue-500" },
    { value: "habits", label: "Habits", color: "bg-green-500" },
    { value: "goals", label: "Goals", color: "bg-purple-500" },
    { value: "insights", label: "Insights", color: "bg-orange-500" },
    { value: "conversations", label: "Conversations", color: "bg-pink-500" },
  ];

  useEffect(() => {
    fetchStatistics();
    fetchMemories("all");
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/memory/statistics");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchMemories = async (category: string) => {
    setLoading(true);
    try {
      const endpoint =
        category === "all"
          ? "http://localhost:8000/api/memories/long-term"
          : `http://localhost:8000/api/memory/by-category/${category}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setMemories(Array.isArray(data) ? data : data.memories || []);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch("http://localhost:8000/api/memory/vector/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchResults([]);
    setSearchQuery("");
    fetchMemories(category);
  };

  const handleCleanOldMemories = async () => {
    if (!confirm("Clean memories older than 90 days with low relevance?")) return;

    try {
      const res = await fetch("http://localhost:8000/api/memory/clean-old", {
        method: "DELETE",
      });

      const data = await res.json();
      alert(data.message);
      fetchStatistics();
      fetchMemories(selectedCategory);
    } catch (error) {
      console.error("Failed to clean memories:", error);
    }
  };

  const displayMemories = searchResults.length > 0 ? searchResults : memories;

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.color || "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Memory Insights</h1>
          <p className="text-gray-600 mt-1">Explore your AI's long-term memory and insights</p>
        </div>
        <Button variant="destructive" onClick={handleCleanOldMemories}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clean Old Memories
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
                <Database className="w-4 h-4 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">High Relevance</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.high_relevance_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent (7 days)</CardTitle>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tag className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.by_category || {}).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Vector Search</CardTitle>
          <CardDescription>Search memories using AI-powered similarity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search for memories, insights, or conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? "default" : "outline"}
            onClick={() => handleCategoryChange(cat.value)}
            className="gap-2"
          >
            <span className={`w-3 h-3 rounded-full ${cat.color}`} />
            {cat.label}
            {stats?.by_category[cat.value] && ` (${stats.by_category[cat.value]})`}
          </Button>
        ))}
      </div>

      {/* Memories List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchResults.length > 0
              ? `Search Results (${searchResults.length})`
              : `${selectedCategory === "all" ? "All" : selectedCategory} Memories`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading memories...</div>
          ) : displayMemories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No memories found {searchQuery && `for "${searchQuery}"`}
            </div>
          ) : (
            <div className="space-y-3">
              {displayMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${getCategoryColor(
                          memory.category
                        )}`}
                      >
                        {memory.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{memory.key}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: {(memory.relevance_score || 0).toFixed(2)}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-2 line-clamp-3">{memory.content}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {formatDate(memory.created_at)}</span>
                    {memory.last_accessed_at && (
                      <span>Last accessed: {formatDate(memory.last_accessed_at)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
