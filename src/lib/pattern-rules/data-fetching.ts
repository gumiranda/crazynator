import { PatternRule } from '@/generated/prisma';

export const dataFetchingRules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'use-react-query-for-api-calls',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests using React Query for API calls instead of useEffect + useState',
    pattern: 'useEffect\\s*\\([^}]*(?:fetch|axios|api)[^}]*\\[\\s*\\]\\s*\\)',
    suggestion: 'Consider using React Query (TanStack Query) for API calls instead of useEffect + useState. React Query provides better caching, error handling, loading states, and automatic refetching.',
    codeExample: `// ❌ Manual API calls with useEffect
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await api.getUser(userId)
        setUser(response.data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{user?.name}</div>
}

// ✅ Using React Query
import { useQuery } from '@tanstack/react-query'

function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{user?.name}</div>
}`,
    severity: 'INFO',
    enabled: true,
    priority: 6,
  },
  {
    name: 'improve-query-key-structure',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests improving query key structure for better cache management',
    pattern: 'queryKey:\\s*\\[\\s*[\'"][^\'",]*[\'"]\\s*\\]',
    suggestion: 'Consider using a more structured query key format for better cache management and invalidation. Use arrays with meaningful segments for hierarchical data.',
    codeExample: `// ❌ Simple string keys
const { data } = useQuery({
  queryKey: ['users'], // Too generic
  queryFn: fetchUsers
})

const { data } = useQuery({
  queryKey: ['user-123'], // Hard to invalidate related queries
  queryFn: () => fetchUser(123)
})

// ✅ Structured query keys
const { data: users } = useQuery({
  queryKey: ['users', 'list', { page, limit, search }],
  queryFn: () => fetchUsers({ page, limit, search })
})

const { data: user } = useQuery({
  queryKey: ['users', 'detail', userId],
  queryFn: () => fetchUser(userId)
})

const { data: userPosts } = useQuery({
  queryKey: ['users', userId, 'posts'],
  queryFn: () => fetchUserPosts(userId)
})

// Easy to invalidate all user-related queries
queryClient.invalidateQueries({ queryKey: ['users'] })
// Or specific user data
queryClient.invalidateQueries({ queryKey: ['users', userId] })`,
    severity: 'WARNING',
    enabled: true,
    priority: 7,
  },
  {
    name: 'missing-mutation-optimistic-updates',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests implementing optimistic updates for better user experience',
    pattern: 'useMutation\\s*\\([^}]*\\{[^}]*(?!onMutate)[^}]*\\}',
    suggestion: 'Consider implementing optimistic updates for mutations to improve perceived performance. This provides immediate feedback to users while the request is processing.',
    codeExample: `// ❌ Basic mutation without optimistic updates
const updateUserMutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }
})

// ✅ Mutation with optimistic updates
const updateUserMutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUserData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users', userId] })
    
    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['users', userId])
    
    // Optimistically update
    queryClient.setQueryData(['users', userId], (old) => ({
      ...old,
      ...newUserData
    }))
    
    return { previousUser }
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users', userId], context.previousUser)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['users', userId] })
  }
})`,
    severity: 'INFO',
    enabled: true,
    priority: 5,
  },
  {
    name: 'missing-error-handling',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests proper error handling for queries and mutations',
    pattern: 'use(?:Query|Mutation)\\s*\\([^}]*\\{(?![\\s\\S]*(?:onError|error))[\\s\\S]*\\}',
    suggestion: 'Add proper error handling to your queries and mutations. Consider using error boundaries, toast notifications, or retry mechanisms for better user experience.',
    codeExample: `// ❌ No error handling
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers
})

// ✅ Proper error handling
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  retry: (failureCount, error) => {
    // Retry up to 3 times for network errors
    if (error.status === 404) return false
    return failureCount < 3
  },
  onError: (error) => {
    toast.error(\`Failed to load users: \${error.message}\`)
  }
})

// Error UI handling
if (isError) {
  return (
    <div className="error-state">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={() => refetch()}>Try Again</button>
    </div>
  )
}

// ✅ Mutation error handling
const createUserMutation = useMutation({
  mutationFn: createUser,
  onError: (error) => {
    if (error.status === 400) {
      toast.error('Please check your input')
    } else {
      toast.error('Failed to create user. Please try again.')
    }
  },
  onSuccess: () => {
    toast.success('User created successfully!')
  }
})`,
    severity: 'WARNING',
    enabled: true,
    priority: 8,
  },
  {
    name: 'missing-loading-states',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests implementing proper loading states for better UX',
    pattern: 'use(?:Query|Mutation)\\([^}]*\\{[^}]*\\}[^}]*(?!isLoading|isPending)',
    suggestion: 'Implement proper loading states to provide feedback to users during data fetching operations.',
    codeExample: `// ❌ No loading states
function UserList() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })
  
  return (
    <div>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  )
}

// ✅ Proper loading states
function UserList() {
  const { 
    data: users, 
    isLoading, 
    isFetching, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })
  
  if (isLoading) {
    return <UserListSkeleton />
  }
  
  if (isError) {
    return <ErrorMessage error={error} />
  }
  
  return (
    <div className={isFetching ? 'opacity-50' : ''}>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
      {isFetching && <div className="loading-indicator">Updating...</div>}
    </div>
  )
}

// ✅ Mutation loading states
function CreateUserForm() {
  const createUser = useMutation({
    mutationFn: api.createUser
  })
  
  return (
    <form onSubmit={handleSubmit}>
      <input {...register('name')} />
      <button 
        type="submit" 
        disabled={createUser.isPending}
      >
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}`,
    severity: 'WARNING',
    enabled: true,
    priority: 7,
  },
  {
    name: 'inefficient-cache-configuration',
    category: 'REACT_QUERY',
    type: 'DATA_FETCHING',
    description: 'Suggests optimizing cache configuration for better performance',
    pattern: 'useQuery\\s*\\([^}]*\\{(?![\\s\\S]*(?:staleTime|cacheTime|gcTime))[\\s\\S]*\\}',
    suggestion: 'Consider configuring cache settings (staleTime, gcTime) based on your data freshness requirements to optimize performance and reduce unnecessary network requests.',
    codeExample: `// ❌ Default cache settings for all queries
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers
  // Uses default staleTime: 0 (always stale)
  // Uses default gcTime: 5 minutes
})

// ✅ Optimized cache settings based on data type
// Static/rarely changing data
const { data: config } = useQuery({
  queryKey: ['app-config'],
  queryFn: fetchAppConfig,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000,    // 1 hour
})

// Frequently changing data
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 30 * 1000,      // 30 seconds
  refetchInterval: 60 * 1000, // Refetch every minute
})

// User-specific data
const { data: profile } = useQuery({
  queryKey: ['user', 'profile'],
  queryFn: fetchUserProfile,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,    // 10 minutes
})

// Real-time data
const { data: liveData } = useQuery({
  queryKey: ['live-data'],
  queryFn: fetchLiveData,
  staleTime: 0,              // Always fresh
  refetchInterval: 1000,     // Every second
})`,
    severity: 'INFO',
    enabled: true,
    priority: 4,
  },
];