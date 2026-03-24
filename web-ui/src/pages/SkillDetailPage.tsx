import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Download, ExternalLink, Code, Shield, Copy, Check } from 'lucide-react';

interface SkillDetail {
  id: string;
  name: string;
  namespace: string;
  description: string;
  stars: number;
  downloads: number;
  category: string;
  license: string;
  repository: string;
  homepage?: string;
  keywords: string[];
  compatibility: string[];
  versions: Array<{ version: string; publishedAt: string }>;
  installCommands: Record<string, string>;
}

const SkillDetailPage: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkill = async () => {
      // TODO: 实际调用 API
      // const response = await fetch(`/api/skills/${namespace}/${name}`);
      // const data = await response.json();
      // setSkill(data);

      // 模拟数据
      setSkill({
        id: `${namespace}/${name}`,
        name: name || 'Weather',
        namespace: namespace || 'openclaw',
        description: '获取当前天气和预报。支持多种天气数据源，包括 wttr.in 和 Open-Meteo。',
        stars: 1250,
        downloads: 15420,
        category: '工具',
        license: 'MIT',
        repository: `https://github.com/${namespace}/${name}`,
        homepage: `https://github.com/${namespace}/${name}#readme`,
        keywords: ['weather', 'forecast', 'api', 'climate'],
        compatibility: ['openclaw', 'claude', 'crush'],
        versions: [
          { version: '1.2.0', publishedAt: '2026-03-20' },
          { version: '1.1.0', publishedAt: '2026-03-15' },
          { version: '1.0.0', publishedAt: '2026-03-10' },
        ],
        installCommands: {
          openclaw: 'openclaw clawhub install weather@1.2.0',
          npm: 'npm install @clawskill/weather@1.2.0',
          pip: 'pip install clawskill-weather==1.2.0',
        },
      });
      setLoading(false);
    };

    fetchSkill();
  }, [namespace, name]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-600">技能未找到</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{skill.name}</h1>
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded">
                {skill.category}
              </span>
            </div>
            <p className="text-sm text-gray-500">{skill.namespace}</p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={skill.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            >
              <ExternalLink className="w-4 h-4" />
              <span>源码</span>
            </a>
            {skill.homepage && (
              <a
                href={skill.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="w-4 h-4" />
                <span>文档</span>
              </a>
            )}
          </div>
        </div>

        <p className="text-lg text-gray-700 mb-6">{skill.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{skill.stars}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="w-4 h-4" />
            <span>{skill.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Code className="w-4 h-4" />
            <span>{skill.license}</span>
          </div>
        </div>
      </div>

      {/* Install */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Code className="w-5 h-5" />
          <span>安装</span>
        </h2>

        <div className="space-y-4">
          {Object.entries(skill.installCommands).map(([platform, command]) => (
            <div key={platform} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {platform}
              </label>
              <div className="relative">
                <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  {command}
                </code>
                <button
                  onClick={() => copyToClipboard(command, platform)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition"
                >
                  {copied === platform ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>兼容平台</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {skill.compatibility.map((compat) => (
            <span
              key={compat}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium"
            >
              {compat}
            </span>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold mb-4">关键词</h2>

        <div className="flex flex-wrap gap-2">
          {skill.keywords.map((keyword) => (
            <Link
              key={keyword}
              to={`/search?q=${keyword}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              {keyword}
            </Link>
          ))}
        </div>
      </div>

      {/* Versions */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold mb-4">版本</h2>

        <div className="space-y-2">
          {skill.versions.map((version) => (
            <div
              key={version.version}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-900">{version.version}</span>
                {version.version === skill.versions[0].version && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    最新
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{version.publishedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillDetailPage;