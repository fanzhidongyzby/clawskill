import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Search, LayoutDashboard, BookOpen, Shield, Settings, Package, User } from 'lucide-react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SkillDetailPage from './pages/SkillDetailPage';
import DashboardPage from './pages/DashboardPage';
import Admin from './pages/Admin';
import SkillBrowse from './pages/SkillBrowse';
import SkillManage from './pages/SkillManage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ClawSkill</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>首页</span>
              </Link>
              <Link
                to="/browse"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <Package className="w-4 h-4" />
                <span>技能浏览</span>
              </Link>
              <Link
                to="/search"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <Search className="w-4 h-4" />
                <span>搜索</span>
              </Link>
              <Link
                to="/manage"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>我的技能</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <Settings className="w-4 h-4" />
                <span>仪表盘</span>
              </Link>
              <Link
                to="/admin"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition"
              >
                <Shield className="w-4 h-4" />
                <span>管理</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                登录
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<SkillBrowse />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/skill/:namespace/:name" element={<SkillDetailPage />} />
          <Route path="/manage" element={<SkillManage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2026 ClawSkill. AI Agent Skills Registry.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                文档
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                GitHub
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                关于
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;