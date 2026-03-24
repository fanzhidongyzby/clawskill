import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Zap, Shield, Globe, ArrowRight, Star, Download } from 'lucide-react';

const HomePage: React.FC = () => {
  const featuredSkills = [
    {
      id: 'openclaw/weather',
      name: 'Weather',
      description: '获取当前天气和预报',
      stars: 1250,
      downloads: 15420,
      category: '工具',
    },
    {
      id: 'openclaw/web-search',
      name: 'Web Search',
      description: '网页搜索和内容提取',
      stars: 890,
      downloads: 12340,
      category: '搜索',
    },
    {
      id: 'openclaw/feishu',
      name: 'Feishu Integration',
      description: '飞书文档和聊天集成',
      stars: 670,
      downloads: 8900,
      category: '集成',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI 智能体的技能商店
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          统一管理全球 AI 智能体技能资源。发现、安装、共享技能，让智能体更强大。
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/search"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>搜索技能</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            发布技能
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">一键安装</h3>
          <p className="text-gray-600">
            AI 智能体自动发现和安装技能，无需手动配置。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">安全可靠</h3>
          <p className="text-gray-600">
            自动安全扫描，确保技能代码和依赖的安全性。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">多源集成</h3>
          <p className="text-gray-600">
            支持 GitHub、ClawHub 等多个技能源，统一管理。
          </p>
        </div>
      </section>

      {/* Featured Skills */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">热门技能</h2>
          <Link
            to="/search"
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>查看全部</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredSkills.map((skill) => (
            <Link
              key={skill.id}
              to={`/skill/${skill.id.split('/')[0]}/${skill.id.split('/')[1]}`}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {skill.category}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{skill.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{skill.stars}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>{skill.downloads.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">1,200+</div>
            <div className="text-blue-100">技能资源</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50,000+</div>
            <div className="text-blue-100">下载次数</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">300+</div>
            <div className="text-blue-100">活跃开发者</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;