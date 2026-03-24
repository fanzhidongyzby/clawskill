import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, Star, Download } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  namespace: string;
  description: string;
  stars: number;
  downloads: number;
  category: string;
  keywords: string[];
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'stars' | 'downloads'>('relevance');

  useEffect(() => {
    const fetchSkills = async () => {
      if (!query.trim()) {
        setSkills([]);
        return;
      }

      setLoading(true);
      // TODO: 实际调用 API
      // const response = await fetch(`/api/skills?q=${query}`);
      // const data = await response.json();
      // setSkills(data);

      // 模拟数据
      setTimeout(() => {
        setSkills([
          {
            id: 'openclaw/weather',
            name: 'Weather',
            namespace: 'openclaw',
            description: '获取当前天气和预报',
            stars: 1250,
            downloads: 15420,
            category: '工具',
            keywords: ['weather', 'forecast', 'api'],
          },
          {
            id: 'openclaw/web-search',
            name: 'Web Search',
            namespace: 'openclaw',
            description: '网页搜索和内容提取',
            stars: 890,
            downloads: 12340,
            category: '搜索',
            keywords: ['search', 'web', 'scraping'],
          },
        ]);
        setLoading(false);
      }, 500);
    };

    const timer = setTimeout(fetchSkills, 300);
    return () => clearTimeout(timer);
  }, [query, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 触发搜索
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索技能、关键词或作者..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span>排序:</span>
          </div>
          <div className="flex space-x-2">
            {[
              { value: 'relevance', label: '相关度' },
              { value: 'stars', label: 'Stars' },
              { value: 'downloads', label: '下载量' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  sortBy === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">搜索中...</p>
        </div>
      )}

      {!loading && query && skills.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600">未找到匹配的技能</p>
        </div>
      )}

      {!loading && skills.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-600">找到 {skills.length} 个技能</p>

          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                  <p className="text-sm text-gray-500">{skill.namespace}</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {skill.category}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{skill.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {skill.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{skill.stars}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>{skill.downloads.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;