import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      common: {
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
      },
      skills: {
        title: 'Skill Market',
        browse: 'Skill Browse',
        manage: 'Skill Management',
        publish: 'Publish Skill',
        install: 'Install Skill',
        version: 'Version',
        downloads: 'Downloads',
        rating: 'Rating',
        author: 'Author',
        category: 'Category',
        description: 'Description',
        tags: 'Tags',
        status: 'Status',
        published: 'Published',
        draft: 'Draft',
        archived: 'Archived',
      },
      admin: {
        title: 'Admin',
        users: 'User Management',
        audit: 'Audit Logs',
        approve: 'Approve',
        reject: 'Reject',
      },
    },
  },
  zh: {
    translation: {
      common: {
        search: '搜索',
        filter: '筛选',
        sort: '排序',
        cancel: '取消',
        confirm: '确认',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        create: '创建',
        update: '更新',
      },
      skills: {
        title: '技能市场',
        browse: '技能浏览',
        manage: '技能管理',
        publish: '发布技能',
        install: '安装技能',
        version: '版本',
        downloads: '下载量',
        rating: '评分',
        author: '作者',
        category: '分类',
        description: '描述',
        tags: '标签',
        status: '状态',
        published: '已发布',
        draft: '草稿',
        archived: '已归档',
      },
      admin: {
        title: '管理后台',
        users: '用户管理',
        audit: '审核日志',
        approve: '通过',
        reject: '拒绝',
      },
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n