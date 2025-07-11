'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
  Mail,
  Phone
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface User {
  user_id: string
  fullname: string
  email: string
  phone?: string
  user_type: 'seller' | 'buyer' | 'admin'
  created_at: string
}

interface UsersPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [pagination, setPagination] = useState<UsersPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (user.user_type !== 'admin') {
      router.push('/')
      return
    }

    fetchUsers()
  }, [user, router, pagination.page, searchQuery, userTypeFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(userTypeFilter && { user_type: userTypeFilter })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        alert(data.error || 'Failed to fetch users')
      }
    } catch (error) {
      alert('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setDeleting(userId)
    try {
      const response = await fetch(`/api/admin/users?user_id=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(user => user.user_id !== userId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to delete user')
      }
    } catch (error) {
      alert('Error deleting user')
    } finally {
      setDeleting(null)
    }
  }

  const handleEditUser = async (userData: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        const { user: updatedUser } = await response.json()
        setUsers(users.map(u => u.user_id === updatedUser.user_id ? updatedUser : u))
        setEditing(null)
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to update user')
      }
    } catch (error) {
      alert('Error updating user')
    }
  }

  if (!user || user.user_type !== 'admin') {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all user accounts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* User Type Filter */}
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All User Types</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>

            <Button type="submit" onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Users ({pagination.total})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.user_type === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : user.user_type === 'seller'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.user_type === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditing(user)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={deleting === user.user_id}
                              onClick={() => handleDeleteUser(user.user_id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                      {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleEditUser(editing)
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editing.fullname}
                      onChange={(e) => setEditing({...editing, fullname: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editing.email}
                      onChange={(e) => setEditing({...editing, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editing.phone || ''}
                      onChange={(e) => setEditing({...editing, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type
                    </label>
                    <select
                      value={editing.user_type}
                      onChange={(e) => setEditing({...editing, user_type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 