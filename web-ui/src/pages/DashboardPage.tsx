import React, { useState } from 'react';
import { BookOpen, Star, Download, TrendingUp, Plus, Search } from 'lucide-react';

interface InstalledSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  lastUsed: string;
}

const DashboardPage: React.FC = () => {
  const [installedSkills] = useState<InstalledSkill[]>([
    {
      id: 'openclaw/weather',
      name: 'Weather',
      version: '1.2.0',
      description: '获取当前天气和预报',
      lastUsed: '2小时前',
    },
    {
      id: 'openclaw/web-search',
      name: 'Web Search',
      version: '1.0.0',
      description: '网页搜索和内容提取',
      lastUsed: '1天前',
    },
    {
      id: 'openclaw/feishu',
      name: 'Feishu Integration',
      version: '0.9.0',
      description: '飞书文档和聊天集成',
      lastUsed: '3天前',
    },
  ]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-gray-600">已安装技能</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{installedSkills.length}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Download className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">本月下载</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">42</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="text-gray-600">收藏技能</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">8</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-gray-600">活跃度</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">85%</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索已安装的技能..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            <span>安装技能</span>
          </button>
        </div>
      </div>

      {/* Installed Skills */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">已安装的技能</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {installedSkills.map((skill) => (
            <div key={skill.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {skill.version}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{skill.description}</p>
                  <div className="text-sm text-gray-500">
                    <span className="text-gray-700 font-medium">最后使用：</span>
                    {skill.lastUsed}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    更新
                  </button>
                  <button className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                    卸载
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">最近活动</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">更新了</span>
              <span className="font-medium text-gray-900">openclaw/weather</span>
              <span className="text-gray-500">到 1.2.0</span>
              <span className="text-gray-400">2小时前</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">安装了</span>
              <span className="font-medium text-gray-900">openclaw/feishu</span>
              <span className="text-gray-500">1天前</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">收藏了</span>
              <span className="font-medium text-gray-900">openclaw/web-search</span>
              <span className="text-gray-500">3天前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;